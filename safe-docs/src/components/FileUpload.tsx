import { useState, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import "./FileUpload.css";

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

type MessageType = 'success' | 'error' | 'info';

interface FileUploadProps {
  session: Session;
  onSuccess?: () => void;
}

export default function FileUpload({ session, onSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>('info');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const generateUniqueFilename = (originalFilename: string): string => {
    const timestamp = new Date().getTime();
    const lastDotIndex = originalFilename.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      return `${originalFilename}_${timestamp}`;
    }
    
    const nameWithoutExt = originalFilename.substring(0, lastDotIndex);
    const extension = originalFilename.substring(lastDotIndex);
    return `${nameWithoutExt}_${timestamp}${extension}`;
  };

  const processFile = async (file: File, isRetry = false, newFilename?: string) => {
    const filename = newFilename || file.name;

    const userId = session?.user?.id;
    if (!userId) {
      setMessage("Session invalide : utilisateur non connecté.");
      setMessageType('error');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage("Le fichier est trop volumineux. Taille maximale : 50 MB");
      setMessageType('error');
      return;
    }

    try {
      setUploading(true);
      setMessage(null);
      setUploadProgress(10);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      if (!token) {
        setMessage("Session expirée, veuillez vous reconnecter.");
        setMessageType('error');
        return;
      }

      setUploadProgress(30);

      const base64 = await fileToBase64(file);
      setUploadProgress(60);

      const response = await fetch(`${API_GATEWAY_URL}/v1/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: filename,
          contentType: file.type || 'application/octet-stream',
          base64,
        }),
      });

      setUploadProgress(90);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        
        const errorMessage = errorData.message || errorData.code || '';
        const isRLSError = errorMessage.toLowerCase().includes('row-level security') || 
                          errorMessage.toLowerCase().includes('duplicate') ||
                          errorMessage.toLowerCase().includes('already exists') ||
                          response.status === 409;
        
        if (isRLSError && !isRetry) {
          setUploading(false);
          setUploadProgress(0);
          setMessage("⚠️ Un fichier avec ce nom existe déjà. Veuillez choisir un nouveau nom.");
          setMessageType('info');
          
          const suggestedName = generateUniqueFilename(file.name);
          setNewFileName(suggestedName);
          setPendingFile(file);
          setShowRenameModal(true);
          return;
        }
        
        const friendlyMessage = isRLSError 
          ? "Impossible de téléverser le fichier. Un conflit de nom persiste."
          : `Erreur d'upload : ${errorMessage}`;
        
        setMessage(friendlyMessage);
        setMessageType('error');
        return;
      }

      await response.json();

      setUploadProgress(100);
      
      const successMessage = newFilename 
        ? `✅ Fichier téléversé avec succès sous le nom "${newFilename}" !`
        : `✅ Fichier "${file.name}" téléversé avec succès !`;
      
      setMessage(successMessage);
      setMessageType('success');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      setMessage(`Erreur réseau : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setMessageType('error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    }
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    await processFile(file);
  }
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRenameConfirm = async () => {
    if (!pendingFile || !newFileName.trim()) {
      setMessage("Veuillez entrer un nom de fichier valide.");
      setMessageType('error');
      return;
    }

    setShowRenameModal(false);
    await processFile(pendingFile, true, newFileName.trim());
    setPendingFile(null);
    setNewFileName('');
  };

  const handleRenameCancel = () => {
    setShowRenameModal(false);
    setPendingFile(null);
    setNewFileName('');
    setMessage("Téléversement annulé.");
    setMessageType('info');
    
    setTimeout(() => {
      setMessage(null);
    }, 2000);
  };

  return (
    <div className="file-upload-container">
      {/* Modal de renommage */}
      {showRenameModal && (
        <div className="rename-modal-overlay" onClick={handleRenameCancel}>
          <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rename-modal-header">
              <h3 className="rename-modal-title">Fichier existant</h3>
              <button className="rename-modal-close" onClick={handleRenameCancel}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="rename-modal-content">
              <div className="rename-modal-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <p className="rename-modal-message">
                Un fichier avec le nom <strong>"{pendingFile?.name}"</strong> existe déjà. 
                Veuillez choisir un nouveau nom pour continuer le téléversement.
              </p>
              
              <div className="rename-modal-input-group">
                <label className="rename-modal-label">Nouveau nom du fichier</label>
                <input
                  type="text"
                  className="rename-modal-input"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRenameConfirm()}
                  placeholder="Entrez le nouveau nom..."
                  autoFocus
                />
                <p className="rename-modal-hint">
                  💡 Un nom unique a été suggéré automatiquement
                </p>
              </div>
            </div>
            
            <div className="rename-modal-actions">
              <button className="rename-modal-btn rename-modal-btn-cancel" onClick={handleRenameCancel}>
                Annuler
              </button>
              <button className="rename-modal-btn rename-modal-btn-confirm" onClick={handleRenameConfirm}>
                Téléverser avec ce nom
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFile}
          disabled={uploading}
          className="file-upload-input"
          accept="*/*"
        />

        {!uploading ? (
          <>
            <div className="file-upload-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 15 12 12 15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="file-upload-title">
              {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier'}
            </h3>
            <p className="file-upload-subtitle">
              ou <span className="file-upload-link">parcourez</span> votre ordinateur
            </p>
            <p className="file-upload-info">
              Taille maximale : 50 MB • Tous les types de fichiers acceptés
            </p>
          </>
        ) : (
          <>
            <div className="file-upload-progress-wrapper">
              <div className="file-upload-spinner"></div>
              <h3 className="file-upload-title">Téléversement en cours...</h3>
              <div className="file-upload-progress-bar">
                <div 
                  className="file-upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="file-upload-progress-text">{uploadProgress}%</p>
            </div>
          </>
        )}
      </div>

      {message && (
        <div className={`file-upload-message file-upload-message-${messageType}`}>
          <div className="file-upload-message-icon">
            {messageType === 'success' && (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {messageType === 'error' && (
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            {messageType === 'info' && (
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <span>{message}</span>
        </div>
      )}

      <div className="file-upload-features">
        <div className="file-upload-feature-item">
          <svg className="file-upload-feature-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Chiffrement sécurisé</span>
        </div>
        <div className="file-upload-feature-item">
          <svg className="file-upload-feature-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Traitement rapide</span>
        </div>
        <div className="file-upload-feature-item">
          <svg className="file-upload-feature-icon" viewBox="0 0 24 24" fill="none">
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 8L2 22M17.5 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Stockage privé</span>
        </div>
      </div>
    </div>
  );
}