#!/bin/bash
# Script d'installation du RPI Service Client sur Raspberry Pi
# Crée un service systemd pour démarrage automatique

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      🍓 RPI Service Client - Installation                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Vérifier si root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Ce script doit être exécuté en tant que root (sudo)${NC}"
    exit 1
fi

# Variables
INSTALL_DIR="/opt/rpi-service"
SERVICE_NAME="rpi-client"
CURRENT_DIR=$(pwd)

# Demander les informations
echo -e "${CYAN}Configuration:${NC}"
read -p "Device ID: " DEVICE_ID
read -p "Backend URL (ex: http://192.168.1.100:3001): " BACKEND_URL

if [ -z "$DEVICE_ID" ] || [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Device ID et Backend URL sont requis${NC}"
    exit 1
fi

# Extraire le WebSocket URL
WS_URL=$(echo "$BACKEND_URL" | sed 's/http/ws/')

echo ""
echo -e "${YELLOW}📁 Création du répertoire d'installation...${NC}"
mkdir -p "$INSTALL_DIR"

# Vérifier si l'exécutable existe
if [ -f "$CURRENT_DIR/dist/rpi-client" ]; then
    echo -e "${YELLOW}📦 Copie de l'exécutable compilé...${NC}"
    cp "$CURRENT_DIR/dist/rpi-client" "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/rpi-client"
else
    echo -e "${YELLOW}📦 Copie des fichiers Python...${NC}"
    cp "$CURRENT_DIR"/*.py "$INSTALL_DIR/"
    cp "$CURRENT_DIR/requirements.txt" "$INSTALL_DIR/"
    
    # Installer les dépendances
    echo -e "${YELLOW}📥 Installation des dépendances Python...${NC}"
    pip3 install -r "$INSTALL_DIR/requirements.txt"
fi

# Créer le fichier de configuration
echo -e "${YELLOW}⚙️  Création de la configuration...${NC}"
cat > "$INSTALL_DIR/.env" << EOF
BACKEND_URL=$BACKEND_URL
BACKEND_WS_URL=$WS_URL
DEVICE_ID=$DEVICE_ID
HEARTBEAT_INTERVAL=30
RECONNECT_DELAY=5
GPIO_MODE=BCM
SIMULATION_MODE=false
EOF

# Créer le service systemd
echo -e "${YELLOW}🔧 Configuration du service systemd...${NC}"

if [ -f "$INSTALL_DIR/rpi-client" ]; then
    # Version compilée
    EXEC_CMD="$INSTALL_DIR/rpi-client --device-id $DEVICE_ID"
else
    # Version Python
    EXEC_CMD="/usr/bin/python3 $INSTALL_DIR/main.py --device-id $DEVICE_ID"
fi

cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=RPI Service Client - GPIO Controller
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$EXEC_CMD
WorkingDirectory=$INSTALL_DIR
Restart=always
RestartSec=10
User=root
Environment=PYTHONUNBUFFERED=1

# GPIO access
SupplementaryGroups=gpio

[Install]
WantedBy=multi-user.target
EOF

# Recharger systemd
systemctl daemon-reload

# Activer et démarrer le service
echo -e "${YELLOW}🚀 Démarrage du service...${NC}"
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Vérifier le statut
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ Installation réussie !                       ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Le service est maintenant actif et démarrera automatiquement au boot."
    echo ""
    echo -e "${CYAN}Commandes utiles:${NC}"
    echo "  sudo systemctl status $SERVICE_NAME   # Voir le statut"
    echo "  sudo journalctl -u $SERVICE_NAME -f   # Voir les logs en temps réel"
    echo "  sudo systemctl restart $SERVICE_NAME  # Redémarrer"
    echo "  sudo systemctl stop $SERVICE_NAME     # Arrêter"
else
    echo -e "${RED}❌ Le service n'a pas démarré correctement${NC}"
    echo "Vérifiez les logs avec: sudo journalctl -u $SERVICE_NAME"
    exit 1
fi

