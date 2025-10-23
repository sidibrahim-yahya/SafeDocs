# Guide de Test - SafeDocs DApp 🧪

## Tests Automatisés

### 1. Tests unitaires du Smart Contract

```bash
cd /home/mohamedali/Downloads/ARCHITECTURE/safe-docs-dapp

# Exécuter tous les tests
npm test

# Exécuter avec couverture
npm run coverage
```

Les tests vérifient :
- ✅ Déploiement correct du contrat
- ✅ Inscription des utilisateurs
- ✅ Ajout de fichiers
- ✅ Suppression de fichiers
- ✅ Isolation des données par utilisateur
- ✅ Validation des inputs
- ✅ Protection contre les doubles inscriptions

### 2. Résultats attendus

```
SafeDocs
  Déploiement
    ✓ Devrait déployer le contrat avec succès
    ✓ Devrait définir le bon owner
    ✓ Devrait avoir 0 utilisateurs au départ
  Inscription des utilisateurs
    ✓ Devrait permettre à un utilisateur de s'inscrire
    ✓ Ne devrait pas permettre une double inscription
    ✓ Ne devrait pas accepter un nom d'utilisateur vide
    ✓ Ne devrait pas accepter un nom d'utilisateur trop long
    ✓ Devrait retourner les bonnes informations utilisateur
  Gestion des fichiers
    ✓ Devrait permettre d'ajouter un fichier
    ✓ Ne devrait pas permettre à un non-inscrit d'ajouter un fichier
    ...
```

## Tests Manuels sur Sepolia

### Prérequis
- [ ] MetaMask installé
- [ ] ETH de test sur Sepolia (minimum 0.1 ETH)
- [ ] Contrat déployé sur Sepolia
- [ ] Frontend configuré avec l'adresse du contrat

### Scénario de Test 1 : Connexion Wallet

1. **Action** : Ouvrir http://localhost:3000
2. **Vérification** : La page s'affiche correctement
3. **Action** : Cliquer sur "🦊 Connecter MetaMask"
4. **Vérification** : MetaMask s'ouvre et demande confirmation
5. **Action** : Approuver la connexion
6. **Vérification** : L'adresse du wallet s'affiche en haut à droite
7. **Vérification** : Le réseau Sepolia est affiché dans MetaMask

✅ **Succès** si : Le wallet est connecté et l'adresse s'affiche

### Scénario de Test 2 : Inscription

1. **État initial** : Wallet connecté, non inscrit
2. **Action** : Entrer un nom d'utilisateur (ex: "TestUser123")
3. **Action** : Cliquer sur "S'inscrire"
4. **Vérification** : MetaMask demande confirmation
5. **Action** : Confirmer la transaction
6. **Vérification** : Message "Transaction en cours..."
7. **Vérification** : Message "Inscription réussie !"
8. **Vérification** : L'interface change et affiche le profil

✅ **Succès** si : 
- Transaction confirmée sur Sepolia
- Profil utilisateur affiché
- Nombre de fichiers = 0

### Scénario de Test 3 : Upload de Fichier

1. **État initial** : Utilisateur inscrit
2. **Action** : Cliquer sur "Choisir un fichier"
3. **Action** : Sélectionner un fichier de test (< 50MB)
4. **Action** : Cliquer sur "Ajouter sur IPFS"
5. **Vérification** : Barre de progression s'affiche (10%, 30%, 60%, 90%, 100%)
6. **Vérification** : MetaMask demande confirmation
7. **Action** : Confirmer la transaction
8. **Vérification** : Message "Fichier ajouté avec succès !"
9. **Vérification** : Le fichier apparaît dans la liste

✅ **Succès** si :
- Fichier uploadé sur IPFS (hash généré)
- Transaction confirmée
- Fichier visible dans la liste
- Compteur de fichiers incrémenté

### Scénario de Test 4 : Visualisation de Fichier

1. **État initial** : Au moins 1 fichier dans la liste
2. **Action** : Cliquer sur "Voir" sur un fichier
3. **Vérification** : Nouvel onglet s'ouvre
4. **Vérification** : Le fichier est accessible via IPFS gateway

✅ **Succès** si : Le fichier s'affiche correctement depuis IPFS

### Scénario de Test 5 : Suppression de Fichier

1. **État initial** : Au moins 1 fichier dans la liste
2. **Action** : Cliquer sur "Supprimer" sur un fichier
3. **Vérification** : Message de confirmation s'affiche
4. **Action** : Confirmer la suppression
5. **Vérification** : MetaMask demande confirmation
6. **Action** : Confirmer la transaction
7. **Vérification** : Message "Fichier supprimé avec succès !"
8. **Vérification** : Le fichier disparaît de la liste
9. **Vérification** : Compteur de fichiers décrémenté

✅ **Succès** si :
- Transaction confirmée
- Fichier supprimé de la liste
- Compteur mis à jour

### Scénario de Test 6 : Isolation Multi-Utilisateurs

1. **Compte 1** : Se connecter avec le compte A, ajouter un fichier
2. **Action** : Se déconnecter de MetaMask
3. **Compte 2** : Se connecter avec un compte B différent
4. **Action** : S'inscrire avec le compte B
5. **Vérification** : Aucun fichier du compte A n'est visible
6. **Action** : Ajouter un fichier avec le compte B
7. **Action** : Revenir au compte A
8. **Vérification** : Seuls les fichiers du compte A sont visibles

✅ **Succès** si : Chaque compte voit uniquement ses propres fichiers

## Tests de Sécurité

### Test 1 : Protection contre la Réentrance

**Objectif** : Vérifier que le contrat est protégé contre les attaques de réentrance

```bash
# Ce test est inclus dans les tests automatisés
npm test
```

✅ Le modificateur `nonReentrant` d'OpenZeppelin protège les fonctions critiques

### Test 2 : Validation des Inputs

**Test 2a : Nom d'utilisateur vide**
```javascript
// Devrait échouer
await contract.registerUser("");
// Erreur attendue : "Username cannot be empty"
```

**Test 2b : Nom d'utilisateur trop long**
```javascript
// Devrait échouer
await contract.registerUser("a".repeat(51));
// Erreur attendue : "Username too long"
```

**Test 2c : Hash IPFS vide**
```javascript
// Devrait échouer
await contract.addFile("", "file.pdf", 1024);
// Erreur attendue : "IPFS hash cannot be empty"
```

### Test 3 : Contrôle d'Accès

**Test 3a : Utilisateur non inscrit**
```javascript
// Devrait échouer
await contract.connect(nonRegisteredUser).addFile("Qm...", "file.pdf", 1024);
// Erreur attendue : "User not registered"
```

**Test 3b : Suppression de fichier inexistant**
```javascript
// Devrait échouer
await contract.deleteFile(999);
// Erreur attendue : "File does not exist"
```

### Test 4 : Réseau Incorrect

1. **Action** : Se connecter au réseau Ethereum Mainnet dans MetaMask
2. **Vérification** : Message d'erreur "Veuillez vous connecter au réseau Sepolia"
3. **Action** : Changer pour Sepolia
4. **Vérification** : L'application fonctionne normalement

✅ **Succès** si : L'app détecte et refuse les mauvais réseaux

### Test 5 : Fonds Insuffisants

1. **Action** : Vider presque tout l'ETH du compte (garder < 0.001 ETH)
2. **Action** : Essayer d'ajouter un fichier
3. **Vérification** : MetaMask affiche "Insufficient funds"

✅ **Succès** si : Transaction refusée avant d'être envoyée

## Tests de Performance

### Mesure du Coût en Gas

```bash
# Afficher les coûts en gas
REPORT_GAS=true npm test
```

**Résultats attendus** (approximatifs) :
- `registerUser()` : ~50,000 - 70,000 gas
- `addFile()` : ~80,000 - 120,000 gas
- `deleteFile()` : ~30,000 - 50,000 gas
- `getUserFiles()` : 0 gas (lecture seule)

### Test de Charge

**Ajouter plusieurs fichiers** :
1. Ajouter 10 fichiers successivement
2. Vérifier que tous sont visibles
3. Vérifier que le temps de chargement reste acceptable (< 5s)

✅ **Succès** si : Tous les fichiers sont gérés correctement

## Tests IPFS

### Test 1 : Upload IPFS (avec Pinata configuré)

1. **Prérequis** : Clés Pinata configurées dans `.env`
2. **Action** : Uploader un fichier
3. **Vérification** : Hash IPFS réel généré (commence par "Qm")
4. **Action** : Accéder au fichier via https://ipfs.io/ipfs/[HASH]
5. **Vérification** : Le fichier est accessible

### Test 2 : Upload IPFS (sans Pinata - mode test)

1. **Prérequis** : Pas de clés Pinata
2. **Action** : Uploader un fichier
3. **Vérification** : Hash fictif généré
4. **Vérification** : Message "Configuration IPFS/Pinata manquante"

## Checklist Complète de Test

### Tests Automatisés
- [ ] Tests unitaires passent (npm test)
- [ ] Couverture de code > 80%
- [ ] Pas d'erreur de compilation

### Tests Manuels
- [ ] Connexion MetaMask
- [ ] Inscription utilisateur
- [ ] Upload de fichier
- [ ] Visualisation de fichier
- [ ] Suppression de fichier
- [ ] Isolation multi-utilisateurs
- [ ] Gestion d'erreurs

### Tests de Sécurité
- [ ] Protection réentrance
- [ ] Validation inputs
- [ ] Contrôle d'accès
- [ ] Détection mauvais réseau
- [ ] Gestion fonds insuffisants

### Tests de Performance
- [ ] Coût en gas acceptable
- [ ] Test de charge (10+ fichiers)
- [ ] Temps de réponse < 5s

### Tests IPFS
- [ ] Upload avec Pinata
- [ ] Upload sans Pinata (fallback)
- [ ] Accès aux fichiers

## Rapport de Bugs

Si vous trouvez un bug, notez :
1. **Étapes de reproduction**
2. **Résultat attendu**
3. **Résultat obtenu**
4. **Hash de transaction** (si applicable)
5. **Captures d'écran**
6. **Logs de console**

## Outils de Débogage

### Console du navigateur
```javascript
// Vérifier les événements du contrat
const events = await contract.queryFilter("FileAdded");
console.log(events);
```

### Etherscan Sepolia
Vérifier vos transactions sur :
https://sepolia.etherscan.io/address/[ADRESSE_DU_CONTRAT]

### MetaMask
- Historique des transactions
- Détails du gas utilisé
- Messages d'erreur détaillés

## Ressources

- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [IPFS Gateway Status](https://status.pinata.cloud/)
- [MetaMask Documentation](https://docs.metamask.io/)

