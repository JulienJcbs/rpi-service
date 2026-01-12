#!/bin/bash
# Script de build pour créer un exécutable RPI Service Client
# À exécuter sur le Raspberry Pi pour une compatibilité ARM

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          🍓 RPI Service Client - Build                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 n'est pas installé${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION détecté"

# Créer un environnement virtuel
echo ""
echo -e "${YELLOW}📦 Création de l'environnement virtuel...${NC}"
python3 -m venv .venv
source .venv/bin/activate

# Installer les dépendances
echo ""
echo -e "${YELLOW}📥 Installation des dépendances...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# Build avec PyInstaller
echo ""
echo -e "${YELLOW}🔨 Compilation de l'exécutable...${NC}"
pyinstaller --clean --noconfirm rpi-client.spec

# Copier l'exécutable
echo ""
if [ -f "dist/rpi-client" ]; then
    echo -e "${GREEN}✅ Build réussi !${NC}"
    echo ""
    echo "L'exécutable se trouve dans: dist/rpi-client"
    echo ""
    echo "Usage:"
    echo "  ./dist/rpi-client --device-id <YOUR_DEVICE_ID>"
    echo "  ./dist/rpi-client -d <ID> --simulate"
    echo ""
    
    # Afficher la taille
    SIZE=$(du -h dist/rpi-client | cut -f1)
    echo -e "Taille de l'exécutable: ${GREEN}$SIZE${NC}"
else
    echo -e "${RED}❌ Erreur: L'exécutable n'a pas été créé${NC}"
    exit 1
fi

# Désactiver le venv
deactivate

echo ""
echo -e "${GREEN}🎉 Terminé !${NC}"


