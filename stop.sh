#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Arrêt de SafeDocs${NC}"
echo ""

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Arrêter le frontend React
print_info "Arrêt du frontend React..."
pkill -f "npm run dev" &> /dev/null || true
pkill -f "vite" &> /dev/null || true
sleep 2
print_status "Frontend React arrêté"

# Arrêter les services Docker
print_info "Arrêt des services Docker..."
docker-compose down
print_status "Services Docker arrêtés"

echo ""
echo -e "${GREEN}🎉 SafeDocs arrêté avec succès !${NC}"
echo ""
echo -e "${YELLOW}Pour redémarrer: ${BLUE}./start.sh${NC}"
