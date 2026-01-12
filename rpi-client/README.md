# RPI Client 🍓

Client Python pour Raspberry Pi - Se connecte au backend et gère les GPIO.

## Installation rapide (sur le Raspberry Pi)

### Option 1: Installation automatique avec service systemd

```bash
# Cloner le projet sur le RPi
git clone <your-repo> && cd rpi-service/rpi-client

# Lancer l'installation (crée un service systemd)
sudo ./install.sh
```

### Option 2: Créer un exécutable compilé

```bash
# Sur le Raspberry Pi
./build.sh

# L'exécutable sera dans dist/rpi-client
./dist/rpi-client --device-id <YOUR_ID>
```

### Option 3: Exécution directe avec Python

```bash
pip install -r requirements.txt
python main.py --device-id <YOUR_ID>
```

## Configuration

Créez un fichier `.env` avec les variables suivantes:

```env
# Backend configuration
BACKEND_URL=http://192.168.1.100:3001
BACKEND_WS_URL=ws://192.168.1.100:3001

# Device ID (obtenu depuis le frontend après création du device)
DEVICE_ID=your-device-uuid-here

# Optionnel
HEARTBEAT_INTERVAL=30
RECONNECT_DELAY=5
GPIO_MODE=BCM
SIMULATION_MODE=false
```

## Utilisation

```bash
# Avec l'ID en argument
python main.py --device-id <YOUR_DEVICE_UUID>

# Avec variable d'environnement
export DEVICE_ID=<YOUR_DEVICE_UUID>
python main.py

# Mode simulation (sans GPIO réel)
python main.py --device-id <ID> --simulate
```

## Fonctionnement

1. Le client se connecte au backend via WebSocket
2. Il reçoit la configuration des triggers pour ce device
3. Il configure les GPIO en entrée pour les triggers
4. Quand un événement GPIO est détecté, il exécute les actions associées
5. Toutes les actions sont loggées et envoyées au backend

## Types de Triggers supportés

- **gpio_input**: Détection de signal sur un pin GPIO (bouton, capteur)
- **schedule**: Déclenchement à une heure précise (cron)
- **api_call**: Déclenché via l'API du backend

## Types d'Actions supportées

- **gpio_output**: Envoie un signal HIGH/LOW sur un pin GPIO
- **http_request**: Appelle une URL externe (webhook)
- **delay**: Pause entre deux actions

## Exemple de règle

> "Quand le bouton sur GPIO 17 est pressé, activer le relais sur GPIO 24 pendant 5 secondes"

Configuration dans le frontend:

1. Créer un Trigger "Bouton" de type "Entrée GPIO" sur pin 17
2. Ajouter une Action "Activer relais" de type "Sortie GPIO" sur pin 24, état HIGH, durée 5000ms
