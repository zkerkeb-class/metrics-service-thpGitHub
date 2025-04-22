import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config';

// Créer le dossier de logs s'il n'existe pas
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Créer le logger avec différents transports
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    // Log tous les niveaux dans combined.json
    new winston.transports.File({
      filename: path.join(logDir, 'combined.json'),
      level: 'info'
    }),
    // Log les erreurs dans error.json
    new winston.transports.File({
      filename: path.join(logDir, 'error.json'),
      level: 'error'
    }),
    // Log les alertes dans alerts.json
    new winston.transports.File({
      filename: path.join(logDir, 'alerts.json'),
      level: 'warn'
    })
  ]
});

// Ajouter le transport console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

export default logger; 