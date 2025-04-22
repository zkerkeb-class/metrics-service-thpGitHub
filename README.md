# Service de Monitoring (TypeScript)

Un service de monitoring pour vérifier la disponibilité d'un service web, avec alertes Discord en temps réel.

## Fonctionnalités

- 🕒 **Système CRON** pour des vérifications périodiques
- 🚨 **Alertes Discord** pour changements d'état et latence élevée
- 📊 **Dashboard** pour visualiser les métriques en temps réel
- 📝 **Journalisation** détaillée avec Winston
- 📈 **API REST** pour accéder aux métriques
- 💾 **Stockage** des métriques des dernières 24 heures
- 🔧 **TypeScript** pour un code type-safe et plus robuste

## Prérequis

- Node.js (v16+)
- pnpm (v7+)
- URL de webhook Discord (pour les alertes)

## Installation

1. Cloner le dépôt
   ```bash
   git clone https://github.com/votre-nom/metrics-service.git
   cd metrics-service
   ```

2. Installer les dépendances avec pnpm
   ```bash
   pnpm install
   ```

3. Configurer les variables d'environnement
   ```bash
   cp .env.example .env
   # Modifier .env avec vos paramètres
   ```

4. Compiler et démarrer le service
   ```bash
   pnpm build
   pnpm start
   ```
   
   Pour le développement :
   ```bash
   pnpm dev
   ```

## Résolution des erreurs de typage

Si vous rencontrez des erreurs de typage après l'installation, assurez-vous que les types ont bien été installés :

```bash
# Vérifier que les types sont bien installés
ls -la node_modules/@types
```

Le projet inclut également un fichier `global.d.ts` qui déclare des types globaux pour les modules qui n'ont pas de définitions de types complètes.

## Configuration

Configurez le service via les variables d'environnement dans le fichier `.env` :

| Variable | Description | Défaut |
|----------|-------------|--------|
| PORT | Port du serveur web | 3000 |
| TARGET_URL | URL à surveiller | https://exemple.com |
| CHECK_INTERVAL | Intervalle de vérification (secondes) | 30 |
| RESPONSE_THRESHOLD | Seuil de latence (ms) | 5000 |
| RETRY_COUNT | Nombre de tentatives avant alerte | 3 |
| DISCORD_WEBHOOK_URL | URL du webhook Discord | - |
| METRICS_RETENTION_HOURS | Durée de conservation des métriques (heures) | 24 |

## Utilisation de l'API

### Obtenir toutes les métriques
```
GET /api/metrics
```

### Obtenir le statut actuel
```
GET /api/status
```

### Déclencher une vérification manuelle
```
POST /api/check
```

## Structure du Projet

```
metrics-service/
├── src/
│   ├── services/
│   │   ├── alertService.ts       # Gestion des alertes
│   │   ├── metricsStorage.ts     # Stockage des métriques
│   │   └── monitoringService.ts  # Service de monitoring
│   ├── routes/
│   │   └── api.ts                # Routes de l'API
│   ├── types/
│   │   └── index.ts              # Types et interfaces
│   ├── utils/
│   │   └── logger.ts             # Configuration des logs
│   ├── config.ts                 # Configuration
│   ├── global.d.ts               # Déclarations de types globaux
│   └── index.ts                  # Point d'entrée
├── public/
│   └── index.html                # Interface utilisateur
├── dist/                         # Code compilé (généré)
├── logs/                         # Fichiers de logs
│   ├── combined.json             # Tous les logs
│   ├── error.json                # Logs d'erreurs
│   └── alerts.json               # Logs d'alertes
├── storage/
│   └── metrics.json              # Stockage des métriques
├── tsconfig.json                 # Configuration TypeScript
└── .env                          # Variables d'environnement
```

## Système d'Alertes

Le service envoie des alertes Discord dans les cas suivants :

1. **Changement d'État** : Lorsque le service passe de `up` à `down` ou vice versa
2. **Latence Élevée** : Lorsque le temps de réponse dépasse le seuil configuré

## Types TypeScript

Le projet utilise TypeScript pour garantir la sécurité des types. Les interfaces principales sont :

```typescript
interface Metric {
  status: 'up' | 'down' | 'unknown';
  responseTime: number;
  url: string;
  timestamp: string;
  alerts: Alert[];
  error?: string;
}

type Alert = StatusChangeAlert | HighLatencyAlert;
```

## Formats des Logs

### Logs de statut
```json
{
  "level": "info",
  "message": "Vérification du service",
  "timestamp": "2024-02-05T15:30:00.000Z",
  "metadata": {
    "url": "https://api.example.com",
    "attempt": 1,
    "type": "status_check"
  }
}
```

### Logs d'alerte
```json
{
  "level": "warn",
  "message": "Alerte envoyée avec succès",
  "timestamp": "2024-02-05T15:30:00.000Z",
  "alertType": "status_change",
  "metadata": {
    "type": "status_change",
    "from": "up",
    "to": "down",
    "url": "https://api.example.com",
    "timestamp": "2024-02-05T15:30:00.000Z"
  },
  "type": "alert"
}
```

## Licence

MIT