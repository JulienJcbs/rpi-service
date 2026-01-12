# RPI Service 🎛️

Système de contrôle de Raspberry Pi via GPIO avec gestion centralisée.

## Architecture

```
rpi-service/
├── backend/          # API REST TypeScript (Express + Prisma + SQLite)
├── rpi-client/       # Client Python pour Raspberry Pi
└── frontend/         # Interface React
```

## Composants

### 🖥️ Backend (TypeScript)

- API REST pour gérer les devices, groupes, triggers et actions
- Base de données SQLite avec Prisma ORM
- WebSocket pour communication temps réel avec les RPi

### 🍓 RPI Client (Python)

- Se connecte au backend et récupère sa configuration
- Écoute les événements GPIO et exécute les actions
- Supporte différents types de triggers (boutons, capteurs, etc.)

### 🎨 Frontend (React)

- Interface moderne pour configurer les devices
- Organisation par groupes
- Configuration des triggers et actions GPIO

## Concepts

### Triggers (Déclencheurs)

- **GPIO Input**: Réagit à un signal sur un pin GPIO (bouton, capteur)
- **Schedule**: Déclenche à une heure précise
- **API Call**: Déclenche via appel API externe

### Actions

- **GPIO Output**: Envoie un signal sur un pin GPIO
- **HTTP Request**: Appelle une URL externe
- **Delay**: Attend avant la prochaine action

### Exemple de règle

> "Quand le bouton sur GPIO 17 est pressé, activer le relais sur GPIO 24 pendant 5 secondes"

## Démarrage rapide

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# RPI Client (sur le Raspberry Pi)
cd rpi-client && pip install -r requirements.txt
python main.py --device-id <ID>
```

## Licence

MIT
