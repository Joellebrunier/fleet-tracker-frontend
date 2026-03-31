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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fleet-tracker-600 to-fleet-tracker-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-fleet-tracker-600">Fleet Tracker</h1>
            <p className="mt-2 text-sm text-gray-500">GPS Fleet Management System</p>
          </div>
          <CardTitle className="text-center">Login to your account</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access Fleet Tracker
          </CardDescription>
        </CardHeader>

        <CardContent>
          {(error || localError) && (
            <div className="mb-4 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm">{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-fleet-tracker-600 hover:underline">
              Contact your administrator
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
