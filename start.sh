#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Démarrage de SafeDocs (Docker + Frontend)${NC}"
echo ""

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier que Docker est installé et en cours d'exécution
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker d'abord."
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    print_error "Fichier .env manquant. Veuillez le créer avec les bonnes configurations Supabase."
    exit 1
fi

print_info "Arrêt des services existants..."
docker-compose down &> /dev/null

print_info "Construction et démarrage des services Docker..."
if docker-compose build && docker-compose up -d; then
    print_status "Services Docker démarrés avec succès"
else
    print_error "Erreur lors du démarrage des services Docker"
    exit 1
fi

print_info "Attente du démarrage des services..."
sleep 8

# Vérifier que les services sont en cours d'exécution
print_info "Vérification des services..."
if docker-compose ps | grep -q "Up"; then
    print_status "Tous les services Docker sont en cours d'exécution"
else
    print_error "Certains services Docker ne sont pas démarrés"
    docker-compose ps
    exit 1
fi

# Arrêter le processus frontend existant s'il existe
print_info "Arrêt du frontend existant..."
pkill -f "npm run dev" &> /dev/null || true
pkill -f "vite" &> /dev/null || true

# Vérifier que le port 5175 est libre
if lsof -Pi :5175 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Le port 5175 est déjà utilisé. Tentative de libération..."
    lsof -ti:5175 | xargs kill -9 &> /dev/null || true
    sleep 2
fi

print_info "Démarrage du frontend React sur le port 5175..."
cd safe-docs

# Démarrer le frontend en arrière-plan
npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend démarre
sleep 5

# Vérifier que le frontend est accessible
if curl -s http://localhost:5175 > /dev/null; then
    print_status "Frontend React démarré avec succès sur http://localhost:5175"
else
    print_error "Le frontend React n'est pas accessible"
    kill $FRONTEND_PID &> /dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 SafeDocs est maintenant disponible !${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:5175"
echo -e "${BLUE}🔌 API Gateway:${NC} http://localhost:8080"
echo -e "${BLUE}📁 File Service:${NC} http://localhost:8082"
echo -e "${BLUE}🔐 Auth Service:${NC} http://localhost:8081"
echo ""
echo -e "${YELLOW}📋 Commandes utiles:${NC}"
echo -e "  • Arrêter tout: ${BLUE}./stop.sh${NC}"
echo -e "  • Voir les logs Docker: ${BLUE}docker-compose logs -f${NC}"
echo -e "  • Redémarrer: ${BLUE}./start.sh${NC}"
echo ""
echo -e "${GREEN}✅ Prêt à utiliser ! Ouvrez http://localhost:5175 dans votre navigateur${NC}"

# Garder le script en vie pour maintenir le frontend
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter le frontend (Docker continuera à tourner)${NC}"
wait $FRONTEND_PID
