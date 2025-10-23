import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './Auth.css'

// Icônes SVG
const MailIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LockIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EyeIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ShieldIcon = () => (
  <svg className="auth-hero-icon" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

type MessageType = 'info' | 'error' | 'success'
type AuthMode = 'signin' | 'signup' | 'reset'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('info')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const signIn = async () => {
    if (!email || !password) {
      setMessage('Veuillez renseigner votre email et mot de passe.')
      setMessageType('error')
      return
    }

    if (!validateEmail(email)) {
      setMessage('Veuillez entrer une adresse email valide.')
      setMessageType('error')
      return
    }

    console.log('[Auth] signIn attempt', { email })
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    
    if (error) {
      console.error('[Auth] signIn error', error)
      setMessage('Email ou mot de passe incorrect. Veuillez réessayer.')
      setMessageType('error')
      return
    }
    
    console.log('[Auth] signIn success')
    setMessage('Connexion réussie ! Redirection en cours...')
    setMessageType('success')
  }

  const signUp = async () => {
    if (!email || !password || !confirmPassword) {
      setMessage('Veuillez remplir tous les champs.')
      setMessageType('error')
      return
    }

    if (!validateEmail(email)) {
      setMessage('Veuillez entrer une adresse email valide.')
      setMessageType('error')
      return
    }

    if (password.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères.')
      setMessageType('error')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas.')
      setMessageType('error')
      return
    }

    console.log('[Auth] signUp attempt', { email })
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    setLoading(false)
    
    if (error) {
      console.error('[Auth] signUp error', error)
      setMessage(`Erreur lors de l'inscription : ${error.message}`)
      setMessageType('error')
      return
    }
    
    console.log('[Auth] signUp success')
    setMessage('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.')
    setMessageType('success')
  }

  const resetPassword = async () => {
    if (!email) {
      setMessage('Veuillez entrer votre adresse email.')
      setMessageType('error')
      return
    }

    if (!validateEmail(email)) {
      setMessage('Veuillez entrer une adresse email valide.')
      setMessageType('error')
      return
    }

    console.log('[Auth] resetPassword attempt', { email })
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    setLoading(false)
    
    if (error) {
      console.error('[Auth] resetPassword error', error)
      setMessage(`Erreur : ${error.message}`)
      setMessageType('error')
      return
    }
    
    console.log('[Auth] resetPassword success')
    setMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.')
    setMessageType('success')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (authMode === 'signin') signIn()
      else if (authMode === 'signup') signUp()
      else if (authMode === 'reset') resetPassword()
    }
  }

  const handleSubmit = () => {
    if (authMode === 'signin') signIn()
    else if (authMode === 'signup') signUp()
    else if (authMode === 'reset') resetPassword()
  }

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode)
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-container">
      {/* Panneau gauche - Hero */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-icon-wrapper">
            <ShieldIcon />
          </div>
          <h1 className="auth-hero-title">SafeDocs</h1>
          <p className="auth-hero-subtitle">
            Votre plateforme sécurisée de gestion documentaire
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div className="auth-feature-text">Chiffrement de bout en bout</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">☁️</div>
              <div className="auth-feature-text">Stockage cloud sécurisé</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <div className="auth-feature-text">Accès rapide et fiable</div>
            </div>
          </div>
        </div>
        <div className="auth-hero-gradient"></div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {authMode === 'signin' && 'Bon retour !'}
              {authMode === 'signup' && 'Créer un compte'}
              {authMode === 'reset' && 'Mot de passe oublié'}
            </h2>
            <p className="auth-form-subtitle">
              {authMode === 'signin' && 'Connectez-vous pour accéder à vos documents'}
              {authMode === 'signup' && 'Rejoignez SafeDocs en quelques secondes'}
              {authMode === 'reset' && 'Entrez votre email pour réinitialiser votre mot de passe'}
            </p>
          </div>

          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            {/* Champ Email */}
            <div className="auth-form-group">
              <label className="auth-label">Adresse email</label>
              <div className="auth-input-wrapper">
                <MailIcon />
                <input
                  className="auth-input"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Champ Mot de passe (sauf pour reset) */}
            {authMode !== 'reset' && (
              <div className="auth-form-group">
                <label className="auth-label">Mot de passe</label>
                <div className="auth-input-wrapper">
                  <LockIcon />
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button 
                    type="button" 
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            {/* Champ Confirmation mot de passe (uniquement pour signup) */}
            {authMode === 'signup' && (
              <div className="auth-form-group">
                <label className="auth-label">Confirmer le mot de passe</label>
                <div className="auth-input-wrapper">
                  <LockIcon />
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* Options (uniquement pour signin) */}
            {authMode === 'signin' && (
              <div className="auth-options">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <button 
                  type="button" 
                  className="auth-link"
                  onClick={() => switchMode('reset')}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`auth-message auth-message-${messageType}`}>
                {message}
              </div>
            )}

            {/* Bouton de soumission */}
            <button 
              className="auth-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  {authMode === 'signin' && 'Connexion...'}
                  {authMode === 'signup' && 'Inscription...'}
                  {authMode === 'reset' && 'Envoi...'}
                </>
              ) : (
                <>
                  {authMode === 'signin' && 'Se connecter'}
                  {authMode === 'signup' && 'Créer mon compte'}
                  {authMode === 'reset' && 'Envoyer le lien'}
                </>
              )}
            </button>
          </form>

          {/* Footer avec liens de navigation */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              {authMode === 'signin' && (
                <>
                  Nouveau sur SafeDocs ? 
                  <button className="auth-footer-link" onClick={() => switchMode('signup')}> Créer un compte</button>
                </>
              )}
              {authMode === 'signup' && (
                <>
                  Vous avez déjà un compte ? 
                  <button className="auth-footer-link" onClick={() => switchMode('signin')}> Se connecter</button>
                </>
              )}
              {authMode === 'reset' && (
                <>
                  Retour à la 
                  <button className="auth-footer-link" onClick={() => switchMode('signin')}> connexion</button>
                </>
              )}
            </p>
          </div>
 
        </div>
      </div>
    </div>
  )
}

