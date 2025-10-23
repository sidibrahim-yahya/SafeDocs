# Configuration Docker pour SafeDocs

## Problème identifié

Le projet dockerisé ne pouvait pas uploader ou lire les fichiers sur Supabase à cause des politiques RLS (Row Level Security) car le contexte d'authentification n'était pas correctement transmis.

## Solutions appliquées

### 1. Fichier .env créé
Un fichier `.env` a été créé avec les configurations Supabase nécessaires.

### 2. Service de fichiers modifié
Le service de fichiers a été modifié pour utiliser un client Supabase authentifié avec le token de l'utilisateur au lieu d'utiliser uniquement la clé anonyme.

### 3. Configuration du frontend
Un fichier `.env` a été créé dans le dossier `safe-docs` pour configurer l'URL de l'API Gateway.

### 4. Script unifié
Un script unique `start.sh` démarre automatiquement Docker et le frontend sur le port 5175.

## Configuration requise

### Variables d'environnement (.env à la racine)
```bash
# Configuration Supabase
SUPABASE_URL=https://mtivmpfdjnnuaekccsub.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aXZtcGZkam5udWFla2Njc3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTE1MjksImV4cCI6MjA3NjQ4NzUyOX0.IdvAXbM8lA8uvKehKPTmQD5a0iYrUrOf3xt2pjwiy5Q

# JWT Configuration (OBLIGATOIRE - récupérer depuis Supabase Dashboard > Settings > API)
SUPABASE_JWT_SECRET=votre-jwt-secret-ici
SUPABASE_JWKS_URL=https://mtivmpfdjnnuaekccsub.supabase.co/auth/v1/jwks

# Storage Configuration
STORAGE_BUCKET=premier_tp

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Variables d'environnement (safe-docs/.env)
```bash
VITE_API_GATEWAY_URL=http://localhost:8080
```

## Instructions de démarrage

### 1. Configurer le JWT Secret
**IMPORTANT**: Vous devez récupérer le `SUPABASE_JWT_SECRET` depuis votre tableau de bord Supabase :
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans Settings > API
4. Copiez la valeur "JWT Secret"
5. Remplacez `votre-jwt-secret-ici` dans le fichier `.env`

### 2. Démarrer le projet (Script unifié)
```bash
# Démarrage automatique de Docker + Frontend
./start.sh
```

### 3. Arrêter le projet
```bash
# Arrêt propre de tout
./stop.sh
```

## Architecture corrigée

```
Frontend (localhost:5175)
    ↓ (avec token d'authentification)
API Gateway (localhost:8080)
    ↓ (transmet le token)
File Service (localhost:8082)
    ↓ (utilise le token pour l'authentification Supabase)
Supabase (avec RLS activé)
```

## Vérification

1. Connectez-vous à l'application
2. Essayez d'uploader un fichier
3. Vérifiez que la liste des fichiers s'affiche correctement
4. Testez le téléchargement d'un fichier

## Dépannage

### Erreur "JWT verification failed"
- Vérifiez que `SUPABASE_JWT_SECRET` est correct dans le fichier `.env`
- Assurez-vous que le secret correspond à celui de votre projet Supabase

### Erreur "UNAUTHORIZED"
- Vérifiez que l'utilisateur est bien connecté
- Vérifiez que le token d'authentification est transmis correctement

### Erreur de CORS
- Vérifiez que `CORS_ORIGINS` inclut l'URL de votre frontend
- Assurez-vous que le frontend utilise la bonne URL de l'API Gateway

## Logs utiles

```bash
# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f file-service
docker-compose logs -f api-gateway
```
