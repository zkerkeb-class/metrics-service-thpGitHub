import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import MetricsStorage from '../services/metricsStorage';
import MonitoringService from '../services/monitoringService';

const createApiRouter = (metricsStorage: MetricsStorage, monitoringService: MonitoringService): Router => {
  const router = Router();

  // Récupérer toutes les métriques
  router.get('/metrics', async (_req: Request, res: Response) => {
    try {
      const metrics = await metricsStorage.getMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Échec de récupération des métriques', { 
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });

  // Récupérer le statut actuel
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const latestMetric = await metricsStorage.getLatestMetric();
      
      if (!latestMetric) {
        return res.json({
          status: 'unknown',
          message: 'Aucune vérification effectuée'
        });
      }
      
      res.json({
        status: latestMetric.status,
        lastCheck: latestMetric.timestamp,
        responseTime: latestMetric.responseTime,
        url: latestMetric.url
      });
    } catch (error) {
      logger.error('Échec de récupération du statut', { 
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });

  // Déclencher une vérification manuelle
  router.post('/check', async (_req: Request, res: Response) => {
    try {
      const result = await monitoringService.checkService();
      res.json(result);
    } catch (error) {
      logger.error('Échec de la vérification manuelle', { 
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });

  return router;
};

export default createApiRouter; 