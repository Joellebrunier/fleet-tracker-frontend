import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { UserRole } from '@/types/user'

// Layout
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import MapPage from '@/pages/MapPage'
import VehiclesPage from '@/pages/VehiclesPage'
import VehicleDetailPage from '@/pages/VehicleDetailPage'
import GeofencesPage from '@/pages/GeofencesPage'
import AlertsPage from '@/pages/AlertsPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'
import SuperAdminPage from '@/pages/SuperAdminPage'

function App() {
  const { initAuth, isAuthenticated } = useAuth()
  const { theme, setTheme } = useUIStore()

  // Initialize auth on app load
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
        <Route
          path="/vehicles/:id"
          element={<ProtectedRoute><VehicleDetailPage /></ProtectedRoute>}
        />
        <Route path="/geofences" element={<ProtectedRoute><GeofencesPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={<ProtectedRoute requiredRoles={[UserRole.SUPER_ADMIN]}><SuperAdminPage /></ProtectedRoute>}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
