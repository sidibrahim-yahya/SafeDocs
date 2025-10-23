import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import "./FileList.css";

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

type FileRecord = {
  id: string;
  filename: string;
  path: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
  [key: string]: any;
};

interface FileListProps {
  session?: Session;
  user?: { id?: string };
  refreshTrigger?: number;
}

export default function FileList(props: FileListProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const userId = props.user?.id ?? props.session?.user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchFiles();
  }, [userId, props.refreshTrigger]);

  async function fetchFiles() {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_GATEWAY_URL}/v1/files/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setError("Erreur lors du chargement des fichiers.");
        setLoading(false);
        return;
      }

      const result = await response.json();
      const items = result.items || [];
      setFiles(items);
    } catch (err) {
      setError("Erreur réseau lors du chargement des fichiers.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadFile(path: string, filename: string) {
    try {
      const bucket = "premier_tp";
      const { data, error } = await supabase.storage.from(bucket).download(path);

      if (error) {
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (err) {
    }
  }

  async function deleteFile(_fileId: string, path: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter.");
        return;
      }

      const response = await fetch(`${API_GATEWAY_URL}/v1/files/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: path
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        setError(`Erreur lors de la suppression : ${errorData.message || 'Erreur inconnue'}`);
        return;
      }

      await fetchFiles();
    } catch (err) {
      setError("Erreur lors de la suppression du fichier.");
    }
  }

  async function deleteSelectedFiles() {
    if (selectedFiles.size === 0) return;

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedFiles.size} fichier(s) ?`
    );

    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const filesToDelete = files.filter(f => selectedFiles.has(f.id));
      const paths = filesToDelete.map(f => f.path);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter.");
        setDeleting(false);
        return;
      }

      let deleteErrors = 0;
      for (const path of paths) {
        try {
          const response = await fetch(`${API_GATEWAY_URL}/v1/files/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ path }),
          });

          if (!response.ok) {
            deleteErrors++;
          }
        } catch (err) {
          deleteErrors++;
        }
      }

      if (deleteErrors > 0) {
        setError(`${deleteErrors} fichier(s) n'ont pas pu être supprimé(s).`);
      }

      setSelectedFiles(new Set());
      await fetchFiles();
    } catch (err) {
      setError("Erreur lors de la suppression des fichiers.");
    } finally {
      setDeleting(false);
    }
  }

  async function downloadSelectedFiles() {
    if (selectedFiles.size === 0) return;

    const filesToDownload = files.filter(f => selectedFiles.has(f.id));

    for (const file of filesToDownload) {
      await downloadFile(file.path, file.filename);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    if (ext === 'pdf') {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 2v6h6M10 12h4M10 16h4M10 20h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="2"/>
        <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) return 'Date inconnue';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return "À l'instant";
        return `Il y a ${diffMinutes} min`;
      }
      return `Il y a ${diffHours}h`;
    }
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatFullDate = (dateStr?: string) => {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Date inconnue';
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const splitFileName = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return { name: filename, extension: '' };
    }
    return {
      name: filename.substring(0, lastDotIndex),
      extension: filename.substring(lastDotIndex + 1).toUpperCase()
    };
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-list-container">
      {/* Header with refresh button */}
      <div className="file-list-header">
        <div className="file-list-stats">
          <span className="file-list-count">{files.length}</span>
          <span className="file-list-label">
            {files.length === 0 ? 'fichier' : files.length === 1 ? 'fichier' : 'fichiers'}
          </span>
          {selectedFiles.size > 0 && (
            <span className="file-list-selected">
              ({selectedFiles.size} sélectionné{selectedFiles.size > 1 ? 's' : ''})
            </span>
          )}
        </div>
        <div className="file-list-actions">
          {selectedFiles.size > 0 && (
            <>
              <button 
                onClick={downloadSelectedFiles} 
                className="file-list-action-btn file-list-action-btn-primary"
                title="Télécharger la sélection"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Télécharger
              </button>
              <button 
                onClick={deleteSelectedFiles} 
                className="file-list-action-btn file-list-action-btn-danger"
                disabled={deleting}
                title="Supprimer la sélection"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </>
          )}
          <button onClick={fetchFiles} className="file-list-refresh-btn" disabled={loading}>
            <svg className={`file-list-refresh-icon ${loading ? 'spinning' : ''}`} viewBox="0 0 24 24" fill="none">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Sélection toolbar */}
      {!loading && !error && files.length > 0 && (
        <div className="file-list-toolbar">
          <label className="file-list-select-all">
            <input 
              type="checkbox"
              checked={selectedFiles.size === files.length && files.length > 0}
              onChange={selectAllFiles}
            />
            <span>Tout sélectionner</span>
          </label>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="file-list-loading">
          <div className="file-list-spinner"></div>
          <p>Chargement des fichiers...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="file-list-error">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && files.length === 0 && (
        <div className="file-list-empty">
          <div className="file-list-empty-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Aucun fichier</h3>
          <p>Vous n'avez pas encore téléversé de fichiers.</p>
        </div>
      )}

      {/* Files grid */}
      {!loading && !error && files.length > 0 && (
        <div className="file-list-grid">
          {files.map((file) => {
            const { name, extension } = splitFileName(file.filename);
            const dateToShow = file.created_at || file.updated_at;
            
            const isSelected = selectedFiles.has(file.id);
            
            return (
              <div 
                key={file.id} 
                className={`file-card ${isSelected ? 'file-card-selected' : ''}`}
              >
                <label className="file-card-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFileSelection(file.id)}
                  />
                </label>
                <div className="file-card-icon">
                  {getFileIcon(file.filename)}
                  {extension && (
                    <div className="file-extension-badge">{extension}</div>
                  )}
                </div>
                <div className="file-card-content">
                  <h4 className="file-card-name" title={file.filename}>
                    {name}
                    {extension && <span className="file-extension-inline">.{extension.toLowerCase()}</span>}
                  </h4>
                  <div className="file-card-meta">
                    <div className="file-card-meta-item">
                      <svg className="file-card-meta-icon" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span title={formatFullDate(dateToShow)}>{formatDate(dateToShow)}</span>
                    </div>
                    {file.metadata?.size && (
                      <div className="file-card-meta-item">
                        <svg className="file-card-meta-icon" viewBox="0 0 24 24" fill="none">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>{formatFileSize(file.metadata.size)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="file-card-actions">
                  <button
                    onClick={() => downloadFile(file.path, file.filename)}
                    className="file-card-action-btn"
                    title="Télécharger"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Voulez-vous vraiment supprimer "${file.filename}" ?`)) {
                        deleteFile(file.id, file.path);
                      }
                    }}
                    className="file-card-action-btn file-card-action-btn-delete"
                    title="Supprimer"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}