import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  targetUrl: string;
  checkInterval: number;
  responseThreshold: number;
  retryCount: number;
  discordWebhookUrl: string | undefined;
  logRetentionDays: number;
  metricsRetentionHours: number;
}

const config: Config = {
  // Configuration du serveur
  port: parseInt(process.env.PORT || '3000', 10),
  
  // URL à surveiller
  targetUrl: process.env.TARGET_URL || 'https://exemple.com',
  
  // Configuration du monitoring
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '30', 10),
  responseThreshold: parseInt(process.env.RESPONSE_THRESHOLD || '5000', 10),
  retryCount: parseInt(process.env.RETRY_COUNT || '3', 10),
  
  // Discord Webhook
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  
  // Configuration des logs
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '7', 10),
  
  // Rétention des métriques (en heures)
  metricsRetentionHours: parseInt(process.env.METRICS_RETENTION_HOURS || '24', 10)
};

export default config; 