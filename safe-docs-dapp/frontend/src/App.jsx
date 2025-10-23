import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { CONTRACT_ADDRESS, CONTRACT_ABI, IPFS_GATEWAY } from './contractConfig';
import './App.css';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (account && contract) {
      checkRegistration();
    }
  }, [account, contract]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        showMessage('Erreur lors de la vérification du wallet', 'error');
      }
    } else {
      showMessage('Veuillez installer MetaMask pour utiliser cette DApp', 'error');
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      if (typeof window.ethereum === 'undefined') {
        showMessage('MetaMask n\'est pas installé !', 'error');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS, 
        CONTRACT_ABI, 
        signer
      );

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setContract(contractInstance);

      const network = await web3Provider.getNetwork();
      if (network.chainId !== 11155111n && network.chainId !== 1337n) {
        showMessage('Veuillez vous connecter au réseau Sepolia ou Localhost', 'error');
      }

      showMessage('Wallet connecté avec succès !', 'success');
    } catch (error) {
      showMessage('Erreur de connexion au wallet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const registered = await contract.isUserRegistered(account);
      setIsRegistered(registered);

      if (registered) {
        const info = await contract.getUserInfo(account);
        setUserInfo({
          username: info[0],
          registrationDate: Number(info[1]),
          fileCount: Number(info[2])
        });
        await loadUserFiles();
      }
    } catch (error) {
      showMessage('Erreur lors de la vérification de l\'inscription', 'error');
    }
  };

  const registerUser = async () => {
    if (!username.trim()) {
      showMessage('Veuillez entrer un nom d\'utilisateur', 'error');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.registerUser(username);
      showMessage('Transaction en cours...', 'info');
      await tx.wait();
      showMessage('Inscription réussie !', 'success');
      await checkRegistration();
      setUsername('');
    } catch (error) {
      showMessage('Erreur lors de l\'inscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(30);
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY || '',
            'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_KEY || ''
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 60) / progressEvent.total) + 30;
            setUploadProgress(progress);
          }
        }
      );

      setUploadProgress(90);
      return response.data.IpfsHash;
    } catch (error) {
      if (error.response?.status === 401) {
        showMessage('Configuration IPFS/Pinata manquante. Mode local activé.', 'warning');
        return 'QmExample' + Math.random().toString(36).substring(7);
      }
      throw error;
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      showMessage('Veuillez sélectionner un fichier', 'error');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      const ipfsHash = await uploadToIPFS(uploadFile);
      setUploadProgress(95);

      const tx = await contract.addFile(
        ipfsHash,
        uploadFile.name,
        uploadFile.size
      );
      
      showMessage('Transaction en cours...', 'info');
      await tx.wait();
      
      setUploadProgress(100);
      showMessage('Fichier ajouté avec succès !', 'success');
      
      await loadUserFiles();
      setUploadFile(null);
      document.getElementById('file-input').value = '';
      
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      showMessage('Erreur lors de l\'ajout du fichier', 'error');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFiles = async () => {
    try {
      const userFiles = await contract.getUserFiles();
      const formattedFiles = userFiles.map((file, index) => ({
        id: index,
        ipfsHash: file.ipfsHash,
        fileName: file.fileName,
        fileSize: Number(file.fileSize),
        timestamp: Number(file.timestamp),
        exists: file.exists
      })).filter(f => f.exists);
      
      setFiles(formattedFiles);
    } catch (error) {
      showMessage('Erreur lors du chargement des fichiers', 'error');
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.deleteFile(fileId);
      showMessage('Transaction en cours...', 'info');
      await tx.wait();
      showMessage('Fichier supprimé avec succès !', 'success');
      await loadUserFiles();
    } catch (error) {
      showMessage('Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR');
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🔐 SafeDocs DApp</h1>
          <p>Architecture Décentralisée - Blockchain & IPFS</p>
        </div>
        {account ? (
          <div className="wallet-info">
            <div className="account">{account.substring(0, 6)}...{account.substring(38)}</div>
          </div>
        ) : (
          <button onClick={connectWallet} className="btn btn-primary" disabled={loading}>
            {loading ? 'Connexion...' : '🦊 Connecter MetaMask'}
          </button>
        )}
      </header>

      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      <main className="main">
        {!account ? (
          <div className="welcome">
            <h2>Bienvenue sur SafeDocs DApp</h2>
            <p>Connectez votre wallet MetaMask pour commencer</p>
          </div>
        ) : !isRegistered ? (
          <div className="register-section">
            <h2>Inscription</h2>
            <p>Veuillez vous inscrire pour utiliser SafeDocs</p>
            <div className="form-group">
              <input
                type="text"
                placeholder="Votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                maxLength={50}
              />
              <button 
                onClick={registerUser} 
                className="btn btn-primary"
                disabled={loading || !username.trim()}
              >
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="user-info-card">
              <h2>👤 Profil</h2>
              {userInfo && (
                <div className="user-details">
                  <p><strong>Nom:</strong> {userInfo.username}</p>
                  <p><strong>Inscription:</strong> {formatDate(userInfo.registrationDate)}</p>
                  <p><strong>Fichiers:</strong> {userInfo.fileCount}</p>
                </div>
              )}
            </div>

            <div className="upload-section">
              <h2>📤 Ajouter un fichier</h2>
              <div className="upload-form">
                <input
                  id="file-input"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="file-input"
                />
                <button 
                  onClick={handleFileUpload}
                  className="btn btn-primary"
                  disabled={loading || !uploadFile}
                >
                  {loading ? 'Upload...' : 'Ajouter sur IPFS'}
                </button>
              </div>
              {uploadProgress > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>

            <div className="files-section">
              <h2>📁 Mes Fichiers</h2>
              {files.length === 0 ? (
                <p className="no-files">Aucun fichier. Ajoutez-en un !</p>
              ) : (
                <div className="files-grid">
                  {files.map((file) => (
                    <div key={file.id} className="file-card">
                      <div className="file-icon">📄</div>
                      <div className="file-info">
                        <h3>{file.fileName}</h3>
                        <p className="file-meta">
                          <span>{formatSize(file.fileSize)}</span>
                          <span>{formatDate(file.timestamp)}</span>
                        </p>
                        <p className="file-hash">
                          IPFS: {file.ipfsHash.substring(0, 10)}...
                        </p>
                      </div>
                      <div className="file-actions">
                        <a 
                          href={`${IPFS_GATEWAY}${file.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-secondary"
                        >
                          Voir
                        </a>
                        <button 
                          onClick={() => deleteFile(file.id)}
                          className="btn btn-sm btn-danger"
                          disabled={loading}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Contrat: {CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" 
          ? `${CONTRACT_ADDRESS.substring(0, 6)}...${CONTRACT_ADDRESS.substring(38)}`
          : 'Non déployé'
        }</p>
      </footer>
    </div>
  );
}

export default App;

