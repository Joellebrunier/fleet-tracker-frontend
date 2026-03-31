import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/user'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
}

export default function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  if (requiredRoles && user) {
    if (!requiredRoles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
