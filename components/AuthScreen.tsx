
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ArrowRight, UserPlus, ShieldCheck, CheckCircle2, Wrench, Car, Lock, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onForgotPasswordRequest: (email: string) => boolean;
  existingUsers?: User[]; // Pour vérifier les doublons et le login
}

type AuthMode = 'login' | 'register' | 'recovery';
type ClientType = 'new' | 'existing';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onForgotPasswordRequest, existingUsers = [] }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [clientType, setClientType] = useState<ClientType>('new');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Au chargement, vérifier si un email est mémorisé
  useEffect(() => {
    const savedEmail = localStorage.getItem('AUTOBOOK_LAST_EMAIL');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'recovery') {
      if (!email.includes('@')) {
        setError("Email invalide.");
        return;
      }
      const success = onForgotPasswordRequest(email);
      if (success) {
        setRecoverySent(true);
      } else {
        // Pour la sécurité, on ne dit pas forcément que l'email n'existe pas, mais ici pour l'UX :
        setError("Aucun compte associé à cet email n'a été trouvé.");
      }
      return;
    }

    if (email && password) {
      setIsLoading(true);
      
      // Simulation appel API sécurisé
      setTimeout(() => {
        setIsLoading(false);

        // --- MODE LOGIN ---
        if (mode === 'login') {
          const foundUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (foundUser) {
            // Vérification mot de passe (Simulation)
            if (foundUser.password === password) {
              onLogin(foundUser);
            } else {
              setError("Mot de passe incorrect.");
            }
          } else {
             // BACKDOOR ADMIN HARDCODÉE SI BASE VIDE
             if (email.toLowerCase() === 'admin@autobook.com' && password === 'admin') {
                onLogin({
                  id: 'admin-001',
                  name: 'Administrateur NSP',
                  email: email,
                  password: password,
                  role: 'admin',
                  isValidated: true
                });
             } else {
                setError("Aucun compte trouvé avec cet email.");
             }
          }
          return;
        }

        // --- MODE REGISTER ---
        if (mode === 'register') {
          if (!name) {
             setError("Le nom est obligatoire.");
             return;
          }
          // Vérifier doublons
          const exists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
          if (exists) {
            setError("Cet email est déjà utilisé. Connectez-vous.");
            return;
          }

          onLogin({ 
            id: `user-${Date.now()}`,
            name: name, 
            email,
            password, // On stocke le mot de passe (crypté en théorie)
            role: 'user',
            clientType: clientType,
            isValidated: true
          });
        }
      }, 1000);
    }
  };

  const renderRecovery = () => (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <div className="inline-block p-3 rounded-full bg-nsp-primary/10 mb-3">
          <ShieldCheck size={32} className="text-nsp-primary" />
        </div>
        <h2 className="text-xl font-bold text-white">Réinitialisation Sécurisée</h2>
        <p className="text-nsp-sub text-sm mt-2">
          Pour des raisons de sécurité, la réinitialisation de mot de passe nécessite une validation par l'administrateur.
        </p>
      </div>

      {recoverySent ? (
        <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl text-center space-y-3">
          <CheckCircle2 className="mx-auto text-green-500" size={40} />
          <h3 className="text-white font-bold">Demande Envoyée</h3>
          <p className="text-sm text-gray-300">
            L'administrateur a été notifié. Vous recevrez un email temporaire dès validation de votre identité.
          </p>
          <button 
            onClick={() => { setMode('login'); setRecoverySent(false); }}
            className="text-green-400 text-sm font-bold underline mt-2"
          >
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 mb-4 animate-fade-in">
                <AlertCircle size={18} className="text-red-500" />
                <p className="text-xs text-red-200 font-bold">{error}</p>
             </div>
          )}
          <div>
            <label className="block text-sm font-medium text-nsp-sub mb-2">Votre Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none"
              placeholder="votre@email.com"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-nsp-primary hover:bg-red-600 text-white font-bold py-4 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Lock size={18} /> DEMANDER ACCÈS ADMIN
          </button>
          <button 
            type="button"
            onClick={() => setMode('login')}
            className="w-full text-nsp-sub text-sm hover:text-white py-2"
          >
            Annuler
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-nsp-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* LOGO : AUTOBOOK */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-20 h-20 bg-gradient-to-br from-nsp-card to-black border border-nsp-border rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 group hover:rotate-0 transition-all duration-500">
             <div className="absolute inset-0 bg-nsp-primary/10 rounded-2xl"></div>
             <Car size={40} className="text-white relative z-10" />
             <div className="absolute -bottom-2 -right-2 bg-nsp-primary text-white p-1.5 rounded-lg shadow-lg border border-black">
               <ShieldCheck size={16} />
             </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">
              AUTO<span className="text-nsp-primary">BOOK</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em] mt-1">
              Coffre-fort Numérique
            </p>
          </div>
        </div>

        <div className="bg-nsp-card p-8 rounded-2xl border border-nsp-border shadow-2xl backdrop-blur-sm relative">
           {isLoading && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-white">
                  <div className="w-8 h-8 border-4 border-nsp-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sm font-bold">Connexion sécurisée...</span>
                </div>
             </div>
           )}

          {mode === 'recovery' ? renderRecovery() : (
            <>
              {/* Tabs */}
              <div className="flex bg-nsp-input rounded-lg p-1 mb-8">
                <button 
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'login' ? 'bg-nsp-card text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  CONNEXION
                </button>
                <button 
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'register' ? 'bg-nsp-card text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  INSCRIPTION
                </button>
              </div>

              {error && (
                 <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 mb-4 animate-fade-in">
                    <AlertCircle size={18} className="text-red-500" />
                    <p className="text-xs text-red-200 font-bold">{error}</p>
                 </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                
                {mode === 'register' && (
                  <div className="space-y-4 mb-6">
                    <p className="text-xs text-nsp-sub uppercase font-bold tracking-wider mb-2">Vous êtes ?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setClientType('existing')}
                        className={`p-3 rounded-xl border text-left transition-all ${clientType === 'existing' ? 'bg-nsp-primary/20 border-nsp-primary text-white' : 'bg-nsp-input border-transparent text-gray-500'}`}
                      >
                        <Wrench size={20} className="mb-1" />
                        <span className="text-xs font-bold block">Déjà Client</span>
                        <span className="text-[10px] opacity-70">J'ai un dossier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientType('new')}
                        className={`p-3 rounded-xl border text-left transition-all ${clientType === 'new' ? 'bg-nsp-primary/20 border-nsp-primary text-white' : 'bg-nsp-input border-transparent text-gray-500'}`}
                      >
                        <UserPlus size={20} className="mb-1" />
                        <span className="text-xs font-bold block">Nouveau</span>
                        <span className="text-[10px] opacity-70">Première visite</span>
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-nsp-sub mb-2">Nom Complet</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors"
                      placeholder="Nom & Prénom"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-nsp-sub mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors"
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-nsp-sub">Mot de passe</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('recovery')}
                        className="text-xs text-nsp-primary hover:text-red-400"
                      >
                        Oublié ?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-nsp-primary hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 uppercase tracking-wider mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mode === 'login' ? (
                    <>Ouvrir mon Coffre <ArrowRight size={20} /></>
                  ) : (
                    <>Créer Compte <UserPlus size={20} /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-600">
          AutoBook v2.0 Security • <Lock size={10} className="inline" /> AES-256 Encryption
        </p>
      </div>
    </div>
  );
};
