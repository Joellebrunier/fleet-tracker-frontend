import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function DriverLoginPage() {
  const [loginMode, setLoginMode] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      if (email && password) {
        console.log('Login with:', { email, password, rememberMe });
        setIsLoading(false);
      } else {
        setErrorMessage('Veuillez remplir tous les champs');
        setIsLoading(false);
      }
    }, 1500);
  };

  const handlePinLogin = async () => {
    setErrorMessage('');
    if (pin.length !== 4) {
      setErrorMessage('Le code PIN doit contenir 4 chiffres');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      console.log('Login with PIN:', pin);
      setIsLoading(false);
    }, 1500);
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const pinNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0'],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-blue-900 flex flex-col justify-between p-4 sm:p-6">
      {/* Header Section */}
      <div className="text-center pt-8 sm:pt-12">
        <div className="mb-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            FLEET TRACK
          </h1>
          <p className="text-emerald-100 text-lg sm:text-xl font-light mt-2">
            Espace Conducteur
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Login Mode Tabs */}
        <div className="flex gap-2 mb-6 bg-white bg-opacity-10 rounded-full p-1 backdrop-blur-sm">
          <button
            onClick={() => {
              setLoginMode('email');
              setErrorMessage('');
              setPin('');
            }}
            className={`flex-1 py-3 px-4 rounded-full font-medium text-sm sm:text-base transition-all ${
              loginMode === 'email'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              setLoginMode('pin');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 px-4 rounded-full font-medium text-sm sm:text-base transition-all ${
              loginMode === 'pin'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            Code PIN
          </button>
        </div>

        {/* Email/Phone Login */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <label className="block text-white font-medium text-sm mb-2">
                Email ou téléphone
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-emerald-200 w-5 h-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-100 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-30 transition-all text-base"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-white font-medium text-sm mb-2">
                Mot de passe
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-emerald-200 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-emerald-100 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-30 transition-all text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-emerald-200 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500 bg-opacity-20 border border-red-300 border-opacity-50 rounded-xl p-3 text-red-100 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Forgot Password + Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-emerald-100 hover:text-white transition-colors min-h-11">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-white accent-emerald-400"
                />
                <span className="text-sm">Se souvenir de moi</span>
              </label>
              <button
                type="button"
                className="text-emerald-100 hover:text-white transition-colors text-sm font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-blue-900 font-bold py-4 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-lg text-base min-h-14 flex items-center justify-center mt-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                  Connexion en cours...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        )}

        {/* PIN Login */}
        {loginMode === 'pin' && (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium text-sm mb-4">
                Entrez votre code PIN
              </label>
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-white bg-opacity-20 border-2 border-white border-opacity-40 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                  >
                    {pin[index] ? '●' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500 bg-opacity-20 border border-red-300 border-opacity-50 rounded-xl p-3 text-red-100 text-sm">
                {errorMessage}
              </div>
            )}

            {/* PIN Pad */}
            <div className="space-y-3">
              {pinNumbers.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid gap-3 ${
                    rowIndex === 3 ? 'grid-cols-3' : 'grid-cols-3'
                  }`}
                >
                  {row.map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handlePinDigit(digit)}
                      disabled={pin.length >= 4 || isLoading}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-xl sm:text-2xl border border-white border-opacity-30 transition-all min-h-16 disabled:cursor-not-allowed"
                    >
                      {digit}
                    </button>
                  ))}
                  {rowIndex === 3 && (
                    <button
                      onClick={handlePinBackspace}
                      disabled={pin.length === 0 || isLoading}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 disabled:opacity-50 text-white font-bold py-4 rounded-2xl border border-white border-opacity-30 transition-all min-h-16 disabled:cursor-not-allowed col-span-2"
                    >
                      ← Effacer
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button for PIN */}
            <button
              onClick={handlePinLogin}
              disabled={isLoading || pin.length !== 4}
              className="w-full bg-white text-blue-900 font-bold py-4 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-lg text-base min-h-14 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                  Connexion en cours...
                </div>
              ) : (
                'Valider'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-4 sm:pb-6">
        <p className="text-emerald-100 text-xs sm:text-sm">
          Version 2.1.0
        </p>
      </div>
    </div>
  );
}
