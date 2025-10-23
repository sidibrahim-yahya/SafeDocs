# Guide de Démarrage Rapide 🚀

## Installation en 5 minutes

### 1. Installer les dépendances

```bash
cd /home/mohamedali/Downloads/ARCHITECTURE/safe-docs-dapp

# Installer les dépendances backend
npm install

# Installer les dépendances frontend
cd frontend && npm install && cd ..
```

### 2. Configuration minimale

Créer un fichier `.env` :

```bash
# Copier le template
cp env.example .env
```

Modifier `.env` avec vos clés :

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/VOTRE-CLE-ALCHEMY
PRIVATE_KEY=votre-clé-privée-metamask
ETHERSCAN_API_KEY=votre-clé-etherscan
```

### 3. Obtenir des ETH de test

Visitez un faucet Sepolia :
- https://sepoliafaucet.com/ (recommandé)
- https://www.infura.io/faucet/sepolia

### 4. Déployer le contrat

```bash
# Compiler
npm run compile

# Déployer sur Sepolia
npm run deploy:sepolia
```

Le script affichera l'adresse du contrat déployé.

### 5. Configurer le frontend

Copier l'adresse du contrat depuis `deployment-info.json` et la mettre dans `frontend/src/contractConfig.js` :

```javascript
export const CONTRACT_ADDRESS = "0xADRESSE_DE_VOTRE_CONTRAT";
```

### 6. Lancer l'application

```bash
npm run dev
```

Ouvrir http://localhost:3000 dans votre navigateur.

## Test en local (sans déployer sur Sepolia)

Si vous voulez tester localement sans dépenser de vrais ETH de test :

```bash
# Terminal 1 : Démarrer un nœud local
npm run node

# Terminal 2 : Déployer localement
npm run deploy:local

# Terminal 3 : Lancer le frontend
npm run dev
```

Dans MetaMask :
1. Ajouter un réseau personnalisé
2. RPC URL : http://127.0.0.1:8545
3. Chain ID : 1337
4. Importer un compte de test avec une des clés privées affichées par Hardhat

## Checklist de vérification

- [ ] Node.js installé (>= 16.x)
- [ ] MetaMask installé
- [ ] Compte Alchemy créé et API key obtenue
- [ ] ETH de test reçus sur Sepolia
- [ ] Clé privée ajoutée dans `.env`
- [ ] Smart contract compilé
- [ ] Smart contract déployé
- [ ] Adresse du contrat mise à jour dans le frontend
- [ ] Frontend lancé avec succès

## Problèmes courants

### "Cannot find module '@nomicfoundation/hardhat-toolbox'"

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

### "Invalid project ID" (Alchemy)

Vérifiez que votre `SEPOLIA_RPC_URL` dans `.env` contient la bonne clé API.

### "Insufficient funds"

Obtenez plus d'ETH de test depuis un faucet Sepolia.

### Le frontend ne se connecte pas au contrat

1. Vérifiez que `CONTRACT_ADDRESS` est bien mis à jour
2. Vérifiez que vous êtes sur le bon réseau dans MetaMask (Sepolia)
3. Vérifiez que le contrat est bien déployé

## Commandes utiles

```bash
# Compiler le contrat
npm run compile

# Tester le contrat
npm test

# Déployer localement
npm run deploy:local

# Déployer sur Sepolia
npm run deploy:sepolia

# Lancer le frontend
npm run dev

# Lancer un nœud local
npm run node
```

## Configuration IPFS/Pinata (Optionnel)

Pour uploader réellement des fichiers sur IPFS :

1. Créer un compte sur [Pinata](https://www.pinata.cloud/)
2. Générer une API Key
3. Ajouter dans `.env` :

```env
VITE_PINATA_API_KEY=votre-clé-pinata
VITE_PINATA_SECRET_KEY=votre-secret-pinata
```

Sans cette configuration, l'app générera des hash IPFS fictifs pour les tests.

## Ressources

- [Documentation complète](./README.md)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [MetaMask](https://metamask.io/)
- [Pinata](https://www.pinata.cloud/)

