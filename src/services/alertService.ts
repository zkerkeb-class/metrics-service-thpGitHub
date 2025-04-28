import { WebhookClient, EmbedBuilder } from 'discord.js';
import logger from '../utils/logger';
import config from '../config';
import { Alert, StatusChangeAlert, HighLatencyAlert, BaseAlert } from '../types';

class AlertService {
  private webhook: WebhookClient | null;

  constructor(webhookUrl: string = config.discordWebhookUrl || '') {
    if (!webhookUrl) {
      logger.warn('Aucune URL de webhook Discord configurée, les alertes ne seront pas envoyées');
      this.webhook = null;
      return;
    }

    try {
      // Format attendu: https://discord.com/api/webhooks/:id/:token
      const matches = webhookUrl.match(/\/webhooks\/(\d+)\/(.+)/);
      if (matches && matches.length >= 3) {
        const [, id, token] = matches;
        this.webhook = new WebhookClient({ id, token });
      } else {
        throw new Error('Format d\'URL de webhook Discord invalide');
      }
    } catch (error) {
      logger.error('Échec d\'initialisation du webhook Discord', { 
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      });
      this.webhook = null;
    }
  }

  async sendAlert(alert: Alert): Promise<void> {
    if (!this.webhook) {
      logger.warn('Impossible d\'envoyer l\'alerte: webhook non configuré', { 
        alert,
        type: 'alert'
      });
      return;
    }

    try {
      const embed = this.createEmbed(alert);
      
      await this.webhook.send({
        username: 'Service de Monitoring',
        embeds: [embed]
      });

      logger.warn('Alerte envoyée avec succès', { 
        alertType: alert.type,
        metadata: alert,
        type: 'alert'
      });
    } catch (error) {
      logger.error('Échec d\'envoi de l\'alerte Discord', { 
        error: error instanceof Error ? error.message : String(error),
        alert,
        type: 'error'
      });
    }
  }

  private createEmbed(alert: Alert): Record<string, any> {
    const embed = new EmbedBuilder()
      .setTimestamp()
      .addFields(
        { name: 'URL', value: alert.url || config.targetUrl },
        { name: 'Timestamp', value: new Date().toISOString() }
      );

    switch (alert.type) {
      case 'status_change': {
        const statusAlert = alert as StatusChangeAlert;
        if (statusAlert.to === 'down') {
          embed.setTitle('🔴 Service Down')
            .setDescription(`Le service ${statusAlert.url || config.targetUrl} est injoignable`)
            .setColor(0xFF0000);
          
          if (statusAlert.error) {
            embed.addFields({ name: 'Erreur', value: statusAlert.error });
          }
        } else if (statusAlert.to === 'up') {
          embed.setTitle('🟢 Service Up')
            .setDescription(`Le service ${statusAlert.url || config.targetUrl} est de nouveau accessible`)
            .setColor(0x00FF00);
          
          if (statusAlert.responseTime) {
            embed.addFields({ name: 'Temps de réponse', value: `${statusAlert.responseTime}ms` });
          }
        }
        
        if (statusAlert.from) {
          embed.addFields({ name: 'Statut précédent', value: statusAlert.from });
        }
        break;
      }
        
      case 'high_latency': {
        const latencyAlert = alert as HighLatencyAlert;
        embed.setTitle('⚠️ Latence élevée')
          .setDescription(`Le service ${latencyAlert.url || config.targetUrl} répond lentement`)
          .setColor(0xFFAA00)
          .addFields(
            { name: 'Temps de réponse', value: `${latencyAlert.responseTime}ms` },
            { name: 'Seuil', value: `${latencyAlert.threshold}ms` }
          );
        break;
      }
        
      default: {
        // Ce cas ne devrait jamais se produire grâce au typage, mais on le gère quand même
        const unknownAlert = alert as BaseAlert;
        embed.setTitle('⚠️ Alerte')
          .setDescription(`Alerte pour ${unknownAlert.url || config.targetUrl}`)
          .setColor(0xFFAA00);
      }
    }

    // En discord.js v14, nous devons utiliser la méthode non documentée de conversion
    // car EmbedBuilder n'implémente pas .toJSON()
    return { ...embed };
  }
}

export default AlertService; 