# SafeDocs DApp - Architecture Décentralisée 🔐

Application décentralisée (DApp) pour la gestion sécurisée de documents sur la blockchain Ethereum avec stockage IPFS.

## 📋 Table des matières

- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Utilisation](#utilisation)
- [Tests de sécurité](#tests-de-sécurité)
- [Structure du projet](#structure-du-projet)

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │ <──> │   MetaMask   │ <──> │  Blockchain │
│  React App  │      │   (Wallet)   │      │   Sepolia   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                            │
       │                                            │
       ▼                                            ▼
┌─────────────┐                            ┌─────────────┐
│    IPFS     │                            │    Smart    │
│  (Pinata)   │                            │  Contract   │
└─────────────┘                            └─────────────┘
```

## 🛠️ Technologies

### Smart Contract
- **Solidity** ^0.8.20
- **OpenZeppelin** Contracts (Ownable, ReentrancyGuard)
- **Hardhat** - Framework de développement Ethereum

### Frontend
- **React** 18.2
- **Ethers.js** 6.9 - Interaction avec la blockchain
- **Vite** - Build tool moderne
- **Axios** - Requêtes HTTP pour IPFS

### Blockchain & Stockage
- **Ethereum Sepolia Testnet**
- **IPFS** (via Pinata API)
- **MetaMask** - Wallet Web3

## 📦 Prérequis

### Logiciels nécessaires
- Node.js >= 16.x
- npm ou yarn
- MetaMask (extension navigateur)
- Git

### Comptes nécessaires
1. **Alchemy** ou **Infura** - Pour l'accès RPC Sepolia
   - Créer un compte sur [Alchemy](https://www.alchemy.com/)
   - Créer une nouvelle app Ethereum (réseau Sepolia)

2. **Pinata** - Pour le stockage IPFS
   - Créer un compte sur [Pinata](https://www.pinata.cloud/)
   - Générer une API Key

3. **Etherscan** (optionnel) - Pour la vérification du contrat
   - Créer un compte sur [Etherscan](https://etherscan.io/)
   - Générer une API Key

4. **Faucet Sepolia** - Pour obtenir des ETH de test
   - [Alchemy Faucet](https://sepoliafaucet.com/)
   - [Infura Faucet](https://www.infura.io/faucet/sepolia)

## 🚀 Installation

### 1. Cloner le projet

```bash
cd /home/mohamedali/Downloads/ARCHITECTURE/safe-docs-dapp
```

### 2. Installer les dépendances du projet principal

```bash
npm install
```

### 3. Installer les dépendances du frontend

```bash
cd frontend
npm install
cd ..
```

## ⚙️ Configuration

### 1. Configuration des variables d'environnement

Créer un fichier `.env` à la racine du projet :

```bash
cp env.example .env
```

Modifier le fichier `.env` :

```env
# RPC Sepolia (Alchemy ou Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-ALCHEMY-API-KEY

# Clé privée de votre wallet MetaMask (ATTENTION: Ne jamais commit cette clé!)
PRIVATE_KEY=votre-clé-privée-ici

# Etherscan API Key (pour vérification)
ETHERSCAN_API_KEY=votre-etherscan-api-key

# Configuration IPFS/Pinata
VITE_PINATA_API_KEY=votre-pinata-api-key
VITE_PINATA_SECRET_KEY=votre-pinata-secret-key
```

### 2. Obtenir votre clé privée MetaMask

⚠️ **ATTENTION** : Ne partagez JAMAIS votre clé privée !

1. Ouvrir MetaMask
2. Cliquer sur les 3 points → Détails du compte
3. Exporter la clé privée
4. Copier la clé dans `.env`

### 3. Obtenir des ETH de test sur Sepolia

Visitez un faucet Sepolia et entrez l'adresse de votre wallet :
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia

## 📝 Déploiement

### 1. Compiler le smart contract

```bash
npm run compile
```

### 2. Tester en local (optionnel)

Démarrer un nœud Hardhat local :

```bash
# Terminal 1
npm run node
```

Déployer sur le réseau local :

```bash
# Terminal 2
npm run deploy:local
```

### 3. Déployer sur Sepolia

```bash
npm run deploy:sepolia
```

Le script affichera :
- ✅ L'adresse du contrat déployé
- 📋 Les informations de déploiement dans `deployment-info.json`

### 4. Configurer le frontend

Copier l'adresse du contrat depuis `deployment-info.json` et la coller dans `frontend/src/contractConfig.js` :

```javascript
export const CONTRACT_ADDRESS = "0xVOTRE_ADRESSE_DU_CONTRAT";
```

### 5. Lancer le frontend

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🎮 Utilisation

### 1. Connexion

1. Ouvrir l'application dans votre navigateur
2. Cliquer sur "🦊 Connecter MetaMask"
3. Approuver la connexion dans MetaMask
4. Assurer que vous êtes sur le réseau Sepolia

### 2. Inscription

1. Entrer un nom d'utilisateur
2. Cliquer sur "S'inscrire"
3. Approuver la transaction dans MetaMask
4. Attendre la confirmation

### 3. Ajouter un fichier

1. Cliquer sur "Choisir un fichier"
2. Sélectionner un fichier
3. Cliquer sur "Ajouter sur IPFS"
4. Approuver la transaction
5. Le fichier sera uploadé sur IPFS puis enregistré sur la blockchain

### 4. Gérer les fichiers

- **Voir** : Ouvre le fichier depuis IPFS dans un nouvel onglet
- **Supprimer** : Supprime l'entrée du fichier de la blockchain (le fichier reste sur IPFS)

## 🔒 Tests de sécurité

### Vérifications implémentées

#### Smart Contract
✅ **Protection contre la réentrance** : Utilisation de `ReentrancyGuard`
✅ **Contrôle d'accès** : Seul l'utilisateur peut gérer ses fichiers
✅ **Validation des données** : Vérification de la longueur et du contenu
✅ **Gestion des erreurs** : Messages d'erreur clairs avec `require`

#### Frontend
✅ **Vérification du réseau** : Détection si connecté à Sepolia
✅ **Gestion des erreurs** : Try/catch sur toutes les transactions
✅ **Validation des inputs** : Vérification côté client avant transaction
✅ **Protection XSS** : React échappe automatiquement les données

### Risques identifiés

⚠️ **IPFS Public** : Les fichiers sur IPFS sont accessibles publiquement via leur hash
- Solution : Chiffrer les fichiers avant upload

⚠️ **Gestion des clés** : Les clés privées sont stockées dans MetaMask
- Solution : Ne jamais partager sa clé privée

⚠️ **Coût du gas** : Chaque opération coûte du gas
- Solution : Optimisation du contrat avec Optimizer activé

### Tests à effectuer

```bash
# Tester le contrat
npm test

# Vérifier la couverture
npm run coverage

# Analyser la sécurité avec Slither
slither contracts/SafeDocs.sol
```

## 📁 Structure du projet

```
safe-docs-dapp/
├── contracts/
│   └── SafeDocs.sol          # Smart contract principal
├── scripts/
│   └── deploy.js             # Script de déploiement
├── test/
│   └── SafeDocs.test.js      # Tests unitaires
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Composant principal
│   │   ├── App.css           # Styles
│   │   ├── contractConfig.js # Configuration du contrat
│   │   ├── main.jsx          # Point d'entrée
│   │   └── index.css         # Styles globaux
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── hardhat.config.js         # Configuration Hardhat
├── package.json
├── env.example               # Template des variables d'environnement
└── README.md
```

## 🎯 Fonctionnalités du Smart Contract

### Inscription
```solidity
function registerUser(string memory _username) external
```

### Gestion des fichiers
```solidity
function addFile(string memory _ipfsHash, string memory _fileName, uint256 _fileSize) external
function deleteFile(uint256 _fileId) external
function getFile(uint256 _fileId) external view returns (...)
function getUserFiles() external view returns (...)
```

### Informations utilisateur
```solidity
function getUserInfo(address _userAddress) external view returns (...)
function isUserRegistered(address _userAddress) external view returns (bool)
function getMyFileCount() external view returns (uint256)
```

## 🐛 Dépannage

### Erreur : "User rejected the request"
- L'utilisateur a refusé la transaction dans MetaMask
- Réessayer la transaction

### Erreur : "Insufficient funds"
- Pas assez d'ETH pour payer le gas
- Obtenir des ETH de test depuis un faucet Sepolia

### Erreur : "Wrong network"
- Connecté au mauvais réseau
- Changer pour Sepolia dans MetaMask

### Fichier IPFS non accessible
- Le gateway IPFS peut être lent
- Essayer un autre gateway : https://gateway.pinata.cloud/ipfs/

### Transaction bloquée
- Gas price trop bas
- Augmenter le gas limit dans MetaMask

## 📚 Ressources

- [Documentation Hardhat](https://hardhat.org/docs)
- [Documentation Ethers.js](https://docs.ethers.org/)
- [Documentation OpenZeppelin](https://docs.openzeppelin.com/)
- [Documentation IPFS](https://docs.ipfs.tech/)
- [Documentation Pinata](https://docs.pinata.cloud/)
- [Sepolia Faucet](https://sepoliafaucet.com/)

## 📄 Licence

MIT

## 👥 Auteurs

Projet réalisé dans le cadre du TP SafeDocs - Architecture Décentralisée

