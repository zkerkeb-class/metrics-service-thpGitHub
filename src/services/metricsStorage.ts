import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';
import config from '../config';
import { Metric } from '../types';

class MetricsStorage {
  private retentionHours: number;
  private storagePath: string;
  private storageFile: string;
  
  constructor(retentionHours: number = config.metricsRetentionHours) {
    this.retentionHours = retentionHours;
    this.storagePath = path.join(process.cwd(), 'storage');
    this.storageFile = 'metrics.json';
    
    // Initialiser le stockage
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Créer le dossier de stockage s'il n'existe pas
      await fs.mkdir(this.storagePath, { recursive: true });
      
      // Vérifier si le fichier de métriques existe, sinon le créer
      try {
        await fs.access(this.getStorageFilePath());
      } catch (error) {
        // Le fichier n'existe pas, créer un tableau vide
        await fs.writeFile(this.getStorageFilePath(), JSON.stringify([], null, 2));
      }
    } catch (error) {
      logger.error('Échec d\'initialisation du stockage des métriques', { 
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
    }
  }

  private getStorageFilePath(): string {
    return path.join(this.storagePath, this.storageFile);
  }

  async getMetrics(): Promise<Metric[]> {
    try {
      const data = await fs.readFile(this.getStorageFilePath(), 'utf8');
      return JSON.parse(data) as Metric[];
    } catch (error) {
      logger.error('Échec de lecture des métriques', { 
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      return [];
    }
  }

  async saveMetric(metric: Metric): Promise<Metric[]> {
    try {
      const metrics = await this.getMetrics();
      metrics.push(metric);

      // Calcul de la période de rétention (métriques des dernières X heures)
      const retentionTime = new Date();
      retentionTime.setHours(retentionTime.getHours() - this.retentionHours);

      // Filtrer les anciennes métriques
      const filteredMetrics = metrics.filter(m =>
        new Date(m.timestamp) > retentionTime
      );

      // Sauvegarder les métriques
      await fs.writeFile(
        this.getStorageFilePath(),
        JSON.stringify(filteredMetrics, null, 2)
      );

      return filteredMetrics;
    } catch (error) {
      logger.error('Échec de sauvegarde de la métrique', { 
        error: error instanceof Error ? error.message : String(error),
        metric,
        type: 'error'
      });
      throw error;
    }
  }

  async getLatestMetric(): Promise<Metric | null> {
    const metrics = await this.getMetrics();
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }
}

export default MetricsStorage; 