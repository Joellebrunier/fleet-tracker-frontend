import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, CheckCircle, AlertCircle, Loader } from 'lucide-react';

type VerifyState = 'verifying' | 'success' | 'error' | 'expired';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerifyState>('verifying');
  const [email, setEmail] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    // Simulate email verification process
    const timer = setTimeout(() => {
      // Mock: randomly succeed or show expired
      const random = Math.random();
      if (random > 0.3) {
        setState('success');
        setEmail('utilisateur@exemple.com');
      } else {
        setState('expired');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleResendLink = async () => {
    setState('verifying');
    setTimeout(() => {
      setState('success');
    }, 2000);
  };

  const handleGoToLogin = () => {
    navigate('/login');
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
          {/* Verifying State */}
          {state === 'verifying' && (
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
                  <Loader className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérification en cours</h1>
              <p className="text-gray-600">
                Nous vérifions votre adresse e-mail. Veuillez patienter...
              </p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">E-mail vérifié</h1>
              <p className="text-gray-600 mb-2">
                Votre adresse e-mail a été vérifiée avec succès.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {email || 'utilisateur@exemple.com'}
              </p>

              <button
                onClick={handleGoToLogin}
                className="w-full bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium mb-3"
              >
                Aller à la connexion
              </button>

              <p className="text-xs text-gray-500">
                Vous pouvez maintenant vous connecter avec vos identifiants.
              </p>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur de vérification</h1>
              <p className="text-gray-600 mb-6">
                Une erreur est survenue lors de la vérification de votre adresse e-mail. Veuillez réessayer.
              </p>

              <button
                onClick={handleResendLink}
                className="w-full bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium mb-3"
              >
                Réessayer
              </button>

              <a
                href="/login"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Retour à la connexion
              </a>
            </div>
          )}

          {/* Expired State */}
          {state === 'expired' && (
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien expiré</h1>
              <p className="text-gray-600 mb-6">
                Le lien de vérification a expiré. Veuillez demander un nouveau lien pour continuer.
              </p>

              <button
                onClick={handleResendLink}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors font-medium mb-3"
              >
                Renvoyer le lien
              </button>

              <a
                href="/login"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Retour à la connexion
              </a>
            </div>
          )}
        </div>

        {/* Footer text */}
        <p className="text-center text-gray-400 text-sm mt-6">
          {token ? `Token: ${token.substring(0, 8)}...` : 'Pas de token fourni'}
        </p>
      </div>
    </div>
  );
}
