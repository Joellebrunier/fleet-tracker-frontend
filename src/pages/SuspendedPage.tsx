import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, HelpCircle } from 'lucide-react';

export default function SuspendedPage() {
  const navigate = useNavigate();
  const [suspensionReason] = useState('Non-paiement');

  const handleLogout = () => {
    // Clear auth state (mock)
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@fleettrack.fr?subject=Account Suspension Inquiry';
  };

  const handleSupportPage = () => {
    navigate('/support');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Icon Section */}
          <div className="bg-gradient-to-r from-[#1a2540] to-[#243154] p-8 flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-red-600" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Votre compte a été suspendu
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Nous avons dû suspendre votre accès à Fleet Track.
            </p>

            {/* Reason Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 mb-1">Motif de la suspension</p>
                  <p className="text-sm text-red-700">
                    {suspensionReason === 'Non-paiement'
                      ? 'Un ou plusieurs paiements n\'ont pas pu être traités. Veuillez mettre à jour votre méthode de paiement.'
                      : 'Votre compte ne respecte pas les conditions d\'utilisation de Fleet Track. Pour plus de détails, veuillez contacter notre équipe support.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Pour résoudre cette situation, nous vous recommandons de contacter notre équipe d'assistance. Nous serons heureux de vous aider.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleContactSupport}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Contacter le support
              </button>

              <button
                onClick={handleSupportPage}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium"
              >
                Page support
              </button>

              <button
                onClick={handleLogout}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-2">
                ID de compte
              </p>
              <p className="text-sm font-mono text-gray-700">
                ACC-20260506-7823
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Besoin d'aide supplémentaire?{' '}
              <a
                href="mailto:support@fleettrack.fr"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                support@fleettrack.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
