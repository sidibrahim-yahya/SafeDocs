import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import "./App.css";

// Icônes SVG
function UploadIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
            <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="17" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
    );
}

function FolderIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function HomeIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function LogOutIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
            <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function ShieldCheckIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

type TabType = 'dashboard' | 'upload' | 'files' | 'security';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Récupération sécurisée de la session
    supabase.auth.getSession()
      .then((res) => {
        setSession(res.data.session);
      })
      .catch((err: unknown) => {
        console.error("getSession error:", err);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setSession(session);
      }
    );

    return () => {
      try {
        listener.subscription.unsubscribe();
      } catch {
        // ignore unsubscribe errors
      }
    };
  }, []);

  if (!session) {
    return <Auth />;
  }

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('files');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <ShieldCheckIcon className="sidebar-logo-icon" />
            <span className="sidebar-logo-text">SafeDocs</span>
          </div>
          <div className="sidebar-subtitle">Gestion documentaire sécurisée</div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <HomeIcon className="sidebar-nav-icon" />
            <span>Tableau de bord</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadIcon className="sidebar-nav-icon" />
            <span>Téléverser</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FolderIcon className="sidebar-nav-icon" />
            <span>Mes fichiers</span>
          </button>
          </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {session.user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {session.user?.email?.split('@')[0] || 'Utilisateur'}
              </div>
              <div className="sidebar-user-email">{session.user?.email}</div>
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="sidebar-logout-btn"
            title="Déconnexion"
          >
            <LogOutIcon className="sidebar-logout-icon" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* Top Bar */}
        <header className="app-header">
          <div className="app-header-content">
            <div>
              <h1 className="app-header-title">
                {activeTab === 'dashboard' && 'Tableau de bord'}
                {activeTab === 'upload' && 'Téléverser un fichier'}
                {activeTab === 'files' && 'Mes fichiers'}
                {activeTab === 'security' && 'Sécurité et confidentialité'}
              </h1>
              <p className="app-header-subtitle">
                {activeTab === 'dashboard' && 'Vue d\'ensemble de vos documents'}
                {activeTab === 'upload' && 'Ajoutez de nouveaux fichiers en toute sécurité'}
                {activeTab === 'files' && 'Gérez et téléchargez vos documents'}
                {activeTab === 'security' && 'Informations sur la sécurité de vos données'}
              </p>
          </div>
        </div>
      </header>

        {/* Content Area */}
        <div className="app-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid">
              <div className="dashboard-card dashboard-card-primary" onClick={() => setActiveTab('upload')}>
                <div className="dashboard-card-icon">
                  <UploadIcon className="dashboard-icon" />
                </div>
                <div className="dashboard-card-content">
                  <h3 className="dashboard-card-title">Téléverser un fichier</h3>
                  <p className="dashboard-card-description">
                    Ajoutez de nouveaux documents à votre espace sécurisé
                  </p>
                </div>
              </div>

              <div className="dashboard-card dashboard-card-secondary" onClick={() => setActiveTab('files')}>
                <div className="dashboard-card-icon">
                  <FolderIcon className="dashboard-icon" />
                </div>
                <div className="dashboard-card-content">
                  <h3 className="dashboard-card-title">Mes fichiers</h3>
                  <p className="dashboard-card-description">
                    Accédez à tous vos documents téléversés
                  </p>
                </div>
              </div>

              <div className="dashboard-card dashboard-card-info" onClick={() => setActiveTab('security')}>
                <div className="dashboard-card-icon">
                  <ShieldCheckIcon className="dashboard-icon" />
                </div>
                <div className="dashboard-card-content">
                  <h3 className="dashboard-card-title">Sécurité garantie</h3>
                  <p className="dashboard-card-description">
                    Vos fichiers sont chiffrés et protégés
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="content-section">
              <FileUpload session={session} onSuccess={handleUploadSuccess} />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="content-section">
              <FileList session={session} refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="content-section">
              <div className="security-container">
                <div className="security-header">
                  <div className="security-header-icon">
                    <ShieldCheckIcon className="security-icon-large" />
                  </div>
                  <h2 className="security-title">Votre sécurité est notre priorité</h2>
                  <p className="security-subtitle">
                    Nous utilisons les dernières technologies pour protéger vos données
                  </p>
                </div>

                <div className="security-features-grid">
                  <div className="security-feature-card">
                    <div className="security-feature-icon security-feature-icon-primary">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="security-feature-title">Chiffrement AES-256</h3>
                    <p className="security-feature-description">
                      Tous vos fichiers sont chiffrés avec l'algorithme AES-256, le standard militaire utilisé par les gouvernements.
                    </p>
                    <div className="security-feature-badge security-badge-success">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Actif</span>
                    </div>
                  </div>

                  <div className="security-feature-card">
                    <div className="security-feature-icon security-feature-icon-secondary">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 15v2M17.218 8.273l1.414 1.414M6.782 8.273L5.368 9.687M4 12H2M22 12h-2M17.218 15.727l1.414-1.414M6.782 15.727L5.368 14.313" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="security-feature-title">Authentification sécurisée</h3>
                    <p className="security-feature-description">
                      Connexion protégée avec Supabase Auth, incluant la vérification par email et des sessions cryptées.
                    </p>
                    <div className="security-feature-badge security-badge-success">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Actif</span>
                    </div>
                  </div>

                  <div className="security-feature-card">
                    <div className="security-feature-icon security-feature-icon-info">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="security-feature-title">Stockage isolé</h3>
                    <p className="security-feature-description">
                      Vos fichiers sont stockés dans des buckets privés, isolés par utilisateur. Personne d'autre ne peut y accéder.
                    </p>
                    <div className="security-feature-badge security-badge-success">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Actif</span>
                    </div>
                  </div>

                  <div className="security-feature-card">
                    <div className="security-feature-icon security-feature-icon-warning">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="security-feature-title">Architecture microservices</h3>
                    <p className="security-feature-description">
                      Notre architecture distribuée garantit la disponibilité et la sécurité avec plusieurs couches de protection.
                    </p>
                    <div className="security-feature-badge security-badge-success">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Actif</span>
                    </div>
                  </div>

                  <div className="security-feature-card">
                    <div className="security-feature-icon security-feature-icon-primary">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="security-feature-title">Logs et traçabilité</h3>
                    <p className="security-feature-description">
                      Toutes les actions sont enregistrées de manière sécurisée pour garantir la traçabilité complète.
                    </p>
                    <div className="security-feature-badge security-badge-success">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Actif</span>
                    </div>
                  </div>

                  <div className="security-feature-card">
                    <div className="security-feature-icon security-feature-icon-secondary">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3 className="security-feature-title">Sauvegardes automatiques</h3>
                    <p className="security-feature-description">
                      Vos données sont sauvegardées automatiquement et régulièrement pour prévenir toute perte.
                    </p>
                    <div className="security-feature-badge security-badge-success">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Actif</span>
                    </div>
                  </div>
                </div>

                <div className="security-info-banner">
                  <div className="security-info-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="security-info-content">
                    <h4 className="security-info-title">Vos données vous appartiennent</h4>
                    <p className="security-info-text">
                      Nous ne vendons jamais vos données et ne les partageons avec personne. Vous pouvez les supprimer à tout moment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;