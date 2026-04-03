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
    <div className="min-h-screen bg-gradient-to-br from-[#1E2A4A] to-[#2D3F6B] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Accent glow effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl border border-blue-600 shadow-lg shadow-[#4361EE]/20"></div>
        </div>

        <CardHeader className="space-y-4 relative z-10 p-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 font-sans">
              FLEET <span className="text-blue-600">TRACKER</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 font-mono">
              MATÉRIEL TECH+
            </p>
          </div>
          <CardTitle className="text-center text-gray-900">Login to your account</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your credentials to access Fleet Tracker
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 p-0">
          {(error || localError) && (
            <div className="mb-4 flex items-center space-x-3 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-500">
              <AlertCircle size={20} />
              <p className="text-sm">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-[#3B82F6] transition-colors">
              Contact your administrator
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
