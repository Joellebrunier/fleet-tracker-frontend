import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, MapPin, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email || !password) {
      setLocalError('Veuillez entrer votre email et mot de passe')
      return
    }

    try {
      await login({ email, password })
      navigate('/')
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Échec de la connexion. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2540] to-[#1e3a5f] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#4361EE]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#4361EE]/8 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse" />
        <div className="absolute top-40 left-20 w-1.5 h-1.5 bg-blue-300/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 right-40 w-2 h-2 bg-indigo-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4361EE] to-[#3B52D3] shadow-xl shadow-[#4361EE]/25 mb-5">
            <MapPin className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            FLEET <span className="text-blue-400">TRACKER</span>
          </h1>
          <p className="mt-1.5 text-sm text-blue-200/40 font-medium tracking-widest uppercase">
            Géolocalisation temps réel
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Connexion</h2>
            <p className="text-sm text-white/30 mt-0.5">Accédez à votre tableau de bord</p>
          </div>

          {(error || localError) && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-[13px]">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-10 h-11 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:border-[#4361EE]/50 focus:ring-1 focus:ring-[#4361EE]/30 focus:bg-white/8 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:border-[#4361EE]/50 focus:ring-1 focus:ring-[#4361EE]/30 focus:bg-white/8 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#4361EE] to-[#3B52D3] hover:from-[#3B52D3] hover:to-[#3347C0] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#4361EE]/20 hover:shadow-[#4361EE]/30 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </div>
              ) : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-5 text-center text-[12px] text-white/25">
            Pas de compte ?{' '}
            <a href="#" className="font-medium text-blue-400/60 hover:text-blue-400 transition-colors">
              Contactez votre administrateur
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/15 mt-6">
          Fleet Tracker v2.0 · Mondo Tech
        </p>
      </div>
    </div>
  )
}
