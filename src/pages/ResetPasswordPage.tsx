import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Check, X } from 'lucide-react';

type ResetState = 'request' | 'reset' | 'success' | 'error';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasToken = !!searchParams.get('token');
  const [state, setState] = useState<ResetState>(
    hasToken ? 'reset' : 'request'
  );
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;

    if (score === 0) return { score: 0, label: 'Très faible', color: 'bg-red-500' };
    if (score === 1) return { score: 1, label: 'Faible', color: 'bg-orange-500' };
    if (score === 2) return { score: 2, label: 'Moyen', color: 'bg-yellow-500' };
    if (score === 3) return { score: 3, label: 'Bon', color: 'bg-lime-500' };
    return { score: 4, label: 'Très fort', color: 'bg-emerald-500' };
  };

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isValidPassword = passwordStrength.score >= 2 && passwordsMatch;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setState('success');
    }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas ou ne sont pas assez forts');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setState('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FLEET TRACK</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Success State */}
          {state === 'success' && (
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {hasToken ? 'Mot de passe réinitialisé' : 'Email envoyé'}
              </h1>
              <p className="text-gray-600 mb-6">
                {hasToken
                  ? 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
                  : 'Un lien de réinitialisation a été envoyé à votre adresse e-mail.'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Retour à la connexion
              </button>
            </div>
          )}

          {/* Request State */}
          {state === 'request' && (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Réinitialiser le mot de passe</h1>
              <p className="text-gray-600 mb-6">
                Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
              </p>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="vous@exemple.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <X className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/login"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Retour à la connexion
                </a>
              </div>
            </div>
          )}

          {/* Reset State */}
          {state === 'reset' && (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un nouveau mot de passe</h1>
              <p className="text-gray-600 mb-6">
                Entrez votre nouveau mot de passe ci-dessous.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all`}
                            style={{ width: `${(passwordStrength.score + 1) * 25}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {passwordStrength.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Minimum 8 caractères, majuscules, minuscules, chiffres
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      {passwordsMatch ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-600">Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600">Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <X className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isValidPassword}
                  className="w-full bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/login"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Retour à la connexion
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
