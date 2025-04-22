import axios from 'axios';
import logger from '../utils/logger';
import config from '../config';
import AlertService from './alertService';
import MetricsStorage from './metricsStorage';
import { Metric, StatusChangeAlert, HighLatencyAlert } from '../types';

class MonitoringService {
  private url: string;
  private threshold: number;
  private alertService: AlertService;
  private metricsStorage: MetricsStorage;
  private retryCount: number;
  private lastStatus: 'up' | 'down' | 'unknown' | null;

  constructor(
    url: string = config.targetUrl,
    threshold: number = config.responseThreshold,
    alertService: AlertService,
    metricsStorage: MetricsStorage,
    retryCount: number = config.retryCount
  ) {
    this.url = url;
    this.threshold = threshold;
    this.alertService = alertService;
    this.metricsStorage = metricsStorage;
    this.retryCount = retryCount;
    this.lastStatus = null;
  }

  async checkService(): Promise<Metric> {
    const startTime = Date.now();
    let status: 'up' | 'down' = 'down';
    let responseTime = 0;
    let error: string | undefined;
    let retries = 0;

    while (retries <= this.retryCount) {
      try {
        logger.info('Vérification du service', {
          url: this.url,
          attempt: retries + 1,
          type: 'status_check'
        });

        const response = await axios.get(this.url, { timeout: 5000 });
        responseTime = Date.now() - startTime;
        
        if (response.status >= 200 && response.status < 300) {
          status = 'up';
          break;
        } else {
          status = 'down';
          error = `Code d'état HTTP: ${response.status}`;
        }
      } catch (err) {
        responseTime = Date.now() - startTime;
        status = 'down';
        error = err instanceof Error ? err.message : String(err);
        
        logger.error('Échec de vérification du service', {
          url: this.url,
          error,
          attempt: retries + 1,
          type: 'error'
        });
      }

      // Si le statut est down et que des tentatives sont restantes
      if (status === 'down' && retries < this.retryCount) {
        retries++;
        // Attendre 1 seconde avant la prochaine tentative
        await this.sleep(1000);
      } else {
        break;
      }
    }

    const check: Metric = {
      status,
      responseTime,
      url: this.url,
      timestamp: new Date().toISOString(),
      alerts: []
    };

    if (error) {
      check.error = error;
    }

    await this.processCheck(check);

    return check;
  }

  // Méthode utilitaire pour attendre
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  private async processCheck(check: Metric): Promise<void> {
    try {
      // Vérification du changement d'état
      if (this.lastStatus !== null && this.lastStatus !== check.status) {
        const alert: StatusChangeAlert = {
          type: 'status_change',
          from: this.lastStatus,
          to: check.status,
          url: this.url,
          timestamp: check.timestamp
        };

        if (check.responseTime) {
          alert.responseTime = check.responseTime;
        }

        if (check.error) {
          alert.error = check.error;
        }

        // Ajouter l'alerte à la métrique
        check.alerts.push(alert);

        // Envoyer l'alerte
        await this.alertService.sendAlert(alert);
      }

      // Vérification de la latence élevée (uniquement si le service est up)
      if (check.status === 'up' && check.responseTime > this.threshold) {
        const alert: HighLatencyAlert = {
          type: 'high_latency',
          responseTime: check.responseTime,
          threshold: this.threshold,
          url: this.url,
          timestamp: check.timestamp
        };

        // Ajouter l'alerte à la métrique
        check.alerts.push(alert);

        // Envoyer l'alerte
        await this.alertService.sendAlert(alert);

        logger.warn('Latence élevée détectée', {
          url: this.url,
          responseTime: check.responseTime,
          threshold: this.threshold,
          type: 'alert',
          alertType: 'high_latency'
        });
      }

      // Mettre à jour le dernier statut connu
      this.lastStatus = check.status;

      // Enregistrer la métrique
      await this.metricsStorage.saveMetric(check);

      // Logger le résultat
      logger.info('Vérification du service terminée', {
        url: this.url,
        status: check.status,
        responseTime: check.responseTime,
        type: 'status_check'
      });
    } catch (error) {
      logger.error('Erreur lors du traitement de la vérification', {
        error: error instanceof Error ? error.message : String(error),
        check,
        type: 'error'
      });
    }
  }
}

export default MonitoringService; 