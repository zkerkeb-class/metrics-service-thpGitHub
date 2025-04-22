import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import logger from './utils/logger';
import config from './config';

// Importer les services
import MetricsStorage from './services/metricsStorage';
import AlertService from './services/alertService';
import MonitoringService from './services/monitoringService';
import createApiRouter from './routes/api';

// Créer l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialiser les services
const metricsStorage = new MetricsStorage(config.metricsRetentionHours);
const alertService = new AlertService(config.discordWebhookUrl);
const monitoringService = new MonitoringService(
  config.targetUrl,
  config.responseThreshold,
  alertService,
  metricsStorage,
  config.retryCount
);

// Charger les routes API
const apiRouter = createApiRouter(metricsStorage, monitoringService);
app.use('/api', apiRouter);

// Configurer la tâche CRON
const cronExpression = `*/${config.checkInterval} * * * * *`;
logger.info(`Configuration de la tâche CRON: ${cronExpression}`);

const cronJob = cron.schedule(cronExpression, async () => {
  try {
    logger.info('Exécution du job CRON');
    await monitoringService.checkService();
  } catch (error) {
    logger.error('Erreur dans le job CRON', { 
      error: error instanceof Error ? error.message : String(error),
      type: 'error'
    });
  }
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (error: Error) => {
  logger.error('Promesse rejetée non gérée', { 
    error: error.message,
    stack: error.stack,
    type: 'error'
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Exception non interceptée', { 
    error: error.message,
    stack: error.stack,
    type: 'error'
  });
  process.exit(1);
});

// Démarrer le serveur
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  
  // Exécuter une vérification initiale
  monitoringService.checkService()
    .then(() => {
      logger.info('Vérification initiale terminée');
    })
    .catch((error: Error) => {
      logger.error('Erreur lors de la vérification initiale', { 
        error: error.message,
        type: 'error'
      });
    });
});

// Exporter pour les tests
export { app, cronJob, monitoringService }; 