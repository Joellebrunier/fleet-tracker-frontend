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
const OrganizationAdminPage = lazy(() => import('@/pages/OrganizationAdminPage'))
const FourrieresPage = lazy(() => import('@/pages/FourrieresPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const PublicTrackingPage = lazy(() => import('@/pages/PublicTrackingPage'))
const SupportPage = lazy(() => import('@/pages/SupportPage'))
const DriverDashboardPage = lazy(() => import('@/pages/DriverDashboardPage'))
const SharedLinksPage = lazy(() => import('@/pages/SharedLinksPage'))

// Phase 10 pages
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage'))
const ClientPortalPage = lazy(() => import('@/pages/ClientPortalPage'))

// Driver App module
const DriverAppLayout = lazy(() => import('@/pages/driver-app/DriverAppLayout'))
const DriverAppHome = lazy(() => import('@/pages/driver-app/DriverAppHome'))
const DriverAppVehicles = lazy(() => import('@/pages/driver-app/DriverAppVehicles'))
const DriverAppDeclare = lazy(() => import('@/pages/driver-app/DriverAppDeclare'))
const DriverAppStations = lazy(() => import('@/pages/driver-app/DriverAppStations'))
const DriverAppHistory = lazy(() => import('@/pages/driver-app/DriverAppHistory'))
const DriverAppProfile = lazy(() => import('@/pages/driver-app/DriverAppProfile'))

// Fuel module
const FuelLayout = lazy(() => import('@/pages/fuel/FuelLayout'))
const FuelDashboardPage = lazy(() => import('@/pages/fuel/FuelDashboardPage'))
const FuelVehiclesPage = lazy(() => import('@/pages/fuel/FuelVehiclesPage'))
const FuelTransactionsPage = lazy(() => import('@/pages/fuel/FuelTransactionsPage'))
const FuelStationsPage = lazy(() => import('@/pages/fuel/FuelStationsPage'))
const FuelAnalysisPage = lazy(() => import('@/pages/fuel/FuelAnalysisPage'))
const FuelAnomaliesPage = lazy(() => import('@/pages/fuel/FuelAnomaliesPage'))
const FuelBudgetPage = lazy(() => import('@/pages/fuel/FuelBudgetPage'))
const FuelSettingsPage = lazy(() => import('@/pages/fuel/FuelSettingsPage'))

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
      <Route path="/track/:token" element={<PublicTrackingPage />} />

      {/* Driver App — mobile layout, outside AppLayout */}
      <Route path="/driver-app" element={<ProtectedRoute><DriverAppLayout /></ProtectedRoute>}>
        <Route index element={<DriverAppHome />} />
        <Route path="vehicles" element={<DriverAppVehicles />} />
        <Route path="declare" element={<DriverAppDeclare />} />
        <Route path="stations" element={<DriverAppStations />} />
        <Route path="history" element={<DriverAppHistory />} />
        <Route path="profile" element={<DriverAppProfile />} />
      </Route>

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
        <Route path="/fourrieres" element={<ProtectedRoute><FourrieresPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/driver-dashboard" element={<ProtectedRoute><DriverDashboardPage /></ProtectedRoute>} />
        <Route path="/shared-links" element={<ProtectedRoute><SharedLinksPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
        <Route path="/client-portal" element={<ProtectedRoute><ClientPortalPage /></ProtectedRoute>} />

        {/* Fuel module */}
        <Route path="/fuel" element={<ProtectedRoute><FuelLayout /></ProtectedRoute>}>
          <Route index element={<FuelDashboardPage />} />
          <Route path="vehicles" element={<FuelVehiclesPage />} />
          <Route path="transactions" element={<FuelTransactionsPage />} />
          <Route path="stations" element={<FuelStationsPage />} />
          <Route path="analysis" element={<FuelAnalysisPage />} />
          <Route path="anomalies" element={<FuelAnomaliesPage />} />
          <Route path="budget" element={<FuelBudgetPage />} />
          <Route path="settings" element={<FuelSettingsPage />} />
        </Route>

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
        <Route
          path="/organizations"
          element={<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><OrganizationAdminPage /></ProtectedRoute>}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}

export default App
