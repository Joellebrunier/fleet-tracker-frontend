import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

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
      setLocalError('Please enter both email and password')
      return
    }

    try {
      await login({ email, password })
      navigate('/')
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap');
      `}</style>
      <Card className="w-full max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px] shadow-2xl relative overflow-hidden">
        {/* Accent glow effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 rounded-[12px] border border-[#00E5CC] shadow-lg shadow-[#00E5CC]/20"></div>
        </div>

        <CardHeader className="space-y-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#F0F0F5]" style={{ fontFamily: 'Syne, sans-serif' }}>
              TRACKZONE
            </h1>
            <p className="mt-2 text-sm text-[#6B6B80]" style={{ fontFamily: 'monospace' }}>
              MATÉRIEL TECH+
            </p>
          </div>
          <CardTitle className="text-center text-[#F0F0F5]">Login to your account</CardTitle>
          <CardDescription className="text-center text-[#6B6B80]">
            Enter your credentials to access TrackZone
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10">
          {(error || localError) && (
            <div className="mb-4 flex items-center space-x-3 rounded-lg border border-[#FF4D6A] bg-[#FF4D6A]/10 p-4 text-[#FF4D6A]">
              <AlertCircle size={20} />
              <p className="text-sm">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#F0F0F5]">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0F0F5]">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold hover:opacity-90 transition-opacity rounded-[8px]"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[#6B6B80]">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-[#00E5CC] hover:text-[#00C4B0] transition-colors">
              Contact your administrator
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
