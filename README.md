# SafeDocs - Architecture Docker

Application de gestion de documents sécurisée avec Supabase et architecture microservices.

## 🚀 Démarrage rapide

### Prérequis
- Docker installé et en cours d'exécution
- Node.js installé
- Compte Supabase configuré

### Configuration
1. **Configurez le JWT Secret** dans le fichier `.env` :
   ```bash
   SUPABASE_JWT_SECRET=votre-jwt-secret-depuis-supabase-dashboard
   ```

### Démarrage
```bash
# Démarrage automatique (Docker + Frontend)
./start.sh
```

### Arrêt
```bash
# Arrêt propre de tout
./stop.sh
```

## 📱 Accès à l'application

- **Frontend** : http://localhost:5175
- **API Gateway** : http://localhost:8080
- **File Service** : http://localhost:8082
- **Auth Service** : http://localhost:8081

## 🏗️ Architecture

```
Frontend (localhost:5175)
    ↓ (avec token d'authentification)
API Gateway (localhost:8080)
    ↓ (transmet le token)
File Service (localhost:8082)
    ↓ (utilise le token pour l'authentification Supabase)
Supabase (avec RLS activé)
```

## 📋 Commandes utiles

```bash
# Voir les logs Docker
docker-compose logs -f

# Redémarrer les services Docker uniquement
docker-compose restart

# Voir l'état des services
docker-compose ps
```

## 🔧 Dépannage

### Erreur "JWT verification failed"
- Vérifiez que `SUPABASE_JWT_SECRET` est correct dans le fichier `.env`

### Erreur "UNAUTHORIZED"
- Vérifiez que l'utilisateur est bien connecté
- Vérifiez que le token d'authentification est transmis correctement

### Erreur de CORS
- Vérifiez que le frontend tourne sur le port 5175
- Vérifiez la configuration CORS dans le fichier `.env`

## 📁 Structure du projet

```
ARCHITECTURE/
├── start.sh              # Script de démarrage unifié
├── stop.sh               # Script d'arrêt
├── .env                  # Configuration Supabase
├── docker-compose.yml    # Configuration Docker
├── safe-docs/            # Frontend React
│   ├── .env             # Configuration frontend
│   └── vite.config.ts   # Configuration Vite (port 5175)
└── services/            # Microservices
    ├── api-gateway/     # Point d'entrée API
    ├── auth-service/    # Service d'authentification
    └── file-service/    # Service de gestion des fichiers
```
