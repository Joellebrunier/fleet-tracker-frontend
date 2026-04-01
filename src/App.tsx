import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { UserRole } from '@/types/user'

// Layout (kept eager — needed immediately)
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// All pages lazy-loaded for code-splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const MapPage = lazy(() => import('@/pages/MapPage'))
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage'))
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage'))
const VehicleGroupsPage = lazy(() => import('@/pages/VehicleGroupsPage'))
const DriversPage = lazy(() => import('@/pages/DriversPage'))
const DevicesPage = lazy(() => import('@/pages/DevicesPage'))
const GeofencesPage = lazy(() => import('@/pages/GeofencesPage'))
const AlertsPage = lazy(() => import('@/pages/AlertsPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const SuperAdminPage = lazy(() => import('@/pages/SuperAdminPage'))
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))
const RolesPermissionsPage = lazy(() => import('@/pages/RolesPermissionsPage'))
const ApiDocsPage = lazy(() => import('@/pages/ApiDocsPage'))
const SdkExamplesPage = lazy(() => import('@/pages/SdkExamplesPage'))
const TestEnvironmentPage = lazy(() => import('@/pages/TestEnvironmentPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

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
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/vehicle-groups" element={<ProtectedRoute><VehicleGroupsPage /></ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute><DriversPage /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />
        <Route path="/geofences" element={<ProtectedRoute><GeofencesPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route
          path="/audit-log"
          element={<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><AuditLogPage /></ProtectedRoute>}
        />
        <Route
          path="/roles"
          element={<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><RolesPermissionsPage /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute requiredRoles={[UserRole.SUPER_ADMIN]}><SuperAdminPage /></ProtectedRoute>}
        />
        <Route
          path="/api-docs"
          element={<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><ApiDocsPage /></ProtectedRoute>}
        />
        <Route
          path="/sdk-examples"
          element={<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><SdkExamplesPage /></ProtectedRoute>}
        />
        <Route
          path="/test-environment"
          element={<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><TestEnvironmentPage /></ProtectedRoute>}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}

export default App
