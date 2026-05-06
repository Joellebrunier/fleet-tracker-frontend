import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { UserRole } from '@/types/user';
// Layout (kept eager — needed immediately)
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
// All pages lazy-loaded for code-splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage'));
const VehicleGroupsPage = lazy(() => import('@/pages/VehicleGroupsPage'));
const DriversPage = lazy(() => import('@/pages/DriversPage'));
const DevicesPage = lazy(() => import('@/pages/DevicesPage'));
const GeofencesPage = lazy(() => import('@/pages/GeofencesPage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SuperAdminPage = lazy(() => import('@/pages/SuperAdminPage'));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const RolesPermissionsPage = lazy(() => import('@/pages/RolesPermissionsPage'));
const ApiDocsPage = lazy(() => import('@/pages/ApiDocsPage'));
const SdkExamplesPage = lazy(() => import('@/pages/SdkExamplesPage'));
const TestEnvironmentPage = lazy(() => import('@/pages/TestEnvironmentPage'));
const OrganizationAdminPage = lazy(() => import('@/pages/OrganizationAdminPage'));
const FourrieresPage = lazy(() => import('@/pages/FourrieresPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const PublicTrackingPage = lazy(() => import('@/pages/PublicTrackingPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const DriverDashboardPage = lazy(() => import('@/pages/DriverDashboardPage'));
const SharedLinksPage = lazy(() => import('@/pages/SharedLinksPage'));
// Phase 10 pages
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage'));
const ClientPortalPage = lazy(() => import('@/pages/ClientPortalPage'));
// Phase 11 — Lovable parity pages
const CSRDPage = lazy(() => import('@/pages/CSRDPage'));
const AccountingPage = lazy(() => import('@/pages/AccountingPage'));
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'));
const VehicleArchivePage = lazy(() => import('@/pages/VehicleArchivePage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const ApiDiagnosticsPage = lazy(() => import('@/pages/ApiDiagnosticsPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const SuspendedPage = lazy(() => import('@/pages/SuspendedPage'));
// Driver App module
const DriverAppLayout = lazy(() => import('@/pages/driver-app/DriverAppLayout'));
const DriverAppHome = lazy(() => import('@/pages/driver-app/DriverAppHome'));
const DriverAppVehicles = lazy(() => import('@/pages/driver-app/DriverAppVehicles'));
const DriverAppDeclare = lazy(() => import('@/pages/driver-app/DriverAppDeclare'));
const DriverAppStations = lazy(() => import('@/pages/driver-app/DriverAppStations'));
const DriverAppHistory = lazy(() => import('@/pages/driver-app/DriverAppHistory'));
const DriverAppProfile = lazy(() => import('@/pages/driver-app/DriverAppProfile'));
const DriverLoginPage = lazy(() => import('@/pages/driver-app/DriverLoginPage'));
const DriverOnboardingPage = lazy(() => import('@/pages/driver-app/DriverOnboardingPage'));
// Fuel module — all sub-pages
const FuelLayout = lazy(() => import('@/pages/fuel/FuelLayout'));
const FuelDashboardPage = lazy(() => import('@/pages/fuel/FuelDashboardPage'));
const FuelVehiclesPage = lazy(() => import('@/pages/fuel/FuelVehiclesPage'));
const FuelTransactionsPage = lazy(() => import('@/pages/fuel/FuelTransactionsPage'));
const FuelStationsPage = lazy(() => import('@/pages/fuel/FuelStationsPage'));
const FuelAnalysisPage = lazy(() => import('@/pages/fuel/FuelAnalysisPage'));
const FuelAnomaliesPage = lazy(() => import('@/pages/fuel/FuelAnomaliesPage'));
const FuelBudgetPage = lazy(() => import('@/pages/fuel/FuelBudgetPage'));
const FuelSettingsPage = lazy(() => import('@/pages/fuel/FuelSettingsPage'));
const FuelValidationsPage = lazy(() => import('@/pages/fuel/FuelValidationsPage'));
const FuelPricesPage = lazy(() => import('@/pages/fuel/FuelPricesPage'));
const FuelRecalculationPage = lazy(() => import('@/pages/fuel/FuelRecalculationPage'));
const FuelAnomalyDetailPage = lazy(() => import('@/pages/fuel/FuelAnomalyDetailPage'));
const FuelMapPage = lazy(() => import('@/pages/fuel/FuelMapPage'));
const FuelDriversPage = lazy(() => import('@/pages/fuel/FuelDriversPage'));
const FuelVehicleDetailPage = lazy(() => import('@/pages/fuel/FuelVehicleDetailPage'));
const FuelReportsPage = lazy(() => import('@/pages/fuel/FuelReportsPage'));
const FuelRecalcStatusPage = lazy(() => import('@/pages/fuel/FuelRecalcStatusPage'));
const FuelRecalcAuditPage = lazy(() => import('@/pages/fuel/FuelRecalcAuditPage'));
const FuelRecalcAuditDetailPage = lazy(() => import('@/pages/fuel/FuelRecalcAuditDetailPage'));
const FuelApiDiagnosticsPage = lazy(() => import('@/pages/fuel/FuelApiDiagnosticsPage'));
function PageLoader() {
    return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
}
function App() {
    const { initAuth, isAuthenticated } = useAuth();
    const { theme, setTheme } = useUIStore();
    // Initialize auth on app load
    useEffect(() => {
        initAuth();
    }, [initAuth]);
    // Apply theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    return (_jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: isAuthenticated ? _jsx(Navigate, { to: "/", replace: true }) : _jsx(LoginPage, {}) }), _jsx(Route, { path: "/auth", element: isAuthenticated ? _jsx(Navigate, { to: "/", replace: true }) : _jsx(LoginPage, {}) }), _jsx(Route, { path: "/track/:token", element: _jsx(PublicTrackingPage, {}) }), _jsx(Route, { path: "/t/:slug", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/landing", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/legal", element: _jsx(LegalPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/verify", element: _jsx(VerifyEmailPage, {}) }), _jsx(Route, { path: "/suspended", element: _jsx(SuspendedPage, {}) }), _jsx(Route, { path: "/driver-app/login", element: _jsx(DriverLoginPage, {}) }), _jsxs(Route, { path: "/driver-app", element: _jsx(ProtectedRoute, { children: _jsx(DriverAppLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(DriverAppHome, {}) }), _jsx(Route, { path: "onboarding", element: _jsx(DriverOnboardingPage, {}) }), _jsx(Route, { path: "vehicles", element: _jsx(DriverAppVehicles, {}) }), _jsx(Route, { path: "declare", element: _jsx(DriverAppDeclare, {}) }), _jsx(Route, { path: "stations", element: _jsx(DriverAppStations, {}) }), _jsx(Route, { path: "history", element: _jsx(DriverAppHistory, {}) }), _jsx(Route, { path: "profile", element: _jsx(DriverAppProfile, {}) })] }), _jsxs(Route, { element: _jsx(AppLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/map", element: _jsx(ProtectedRoute, { children: _jsx(MapPage, {}) }) }), _jsx(Route, { path: "/vehicles", element: _jsx(ProtectedRoute, { children: _jsx(VehiclesPage, {}) }) }), _jsx(Route, { path: "/vehicles/:id", element: _jsx(ProtectedRoute, { children: _jsx(VehicleDetailPage, {}) }) }), _jsx(Route, { path: "/vehicles/archive", element: _jsx(ProtectedRoute, { children: _jsx(VehicleArchivePage, {}) }) }), _jsx(Route, { path: "/vehicle-groups", element: _jsx(ProtectedRoute, { children: _jsx(VehicleGroupsPage, {}) }) }), _jsx(Route, { path: "/drivers", element: _jsx(ProtectedRoute, { children: _jsx(DriversPage, {}) }) }), _jsx(Route, { path: "/devices", element: _jsx(ProtectedRoute, { children: _jsx(DevicesPage, {}) }) }), _jsx(Route, { path: "/geofences", element: _jsx(ProtectedRoute, { children: _jsx(GeofencesPage, {}) }) }), _jsx(Route, { path: "/alerts", element: _jsx(ProtectedRoute, { children: _jsx(AlertsPage, {}) }) }), _jsx(Route, { path: "/fourrieres", element: _jsx(ProtectedRoute, { children: _jsx(FourrieresPage, {}) }) }), _jsx(Route, { path: "/reports", element: _jsx(ProtectedRoute, { children: _jsx(ReportsPage, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/support", element: _jsx(ProtectedRoute, { children: _jsx(SupportPage, {}) }) }), _jsx(Route, { path: "/driver-dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DriverDashboardPage, {}) }) }), _jsx(Route, { path: "/shared-links", element: _jsx(ProtectedRoute, { children: _jsx(SharedLinksPage, {}) }) }), _jsx(Route, { path: "/notifications", element: _jsx(ProtectedRoute, { children: _jsx(NotificationsPage, {}) }) }), _jsx(Route, { path: "/maintenance", element: _jsx(ProtectedRoute, { children: _jsx(MaintenancePage, {}) }) }), _jsx(Route, { path: "/client-portal", element: _jsx(ProtectedRoute, { children: _jsx(ClientPortalPage, {}) }) }), _jsx(Route, { path: "/csrd", element: _jsx(ProtectedRoute, { children: _jsx(CSRDPage, {}) }) }), _jsx(Route, { path: "/accounting", element: _jsx(ProtectedRoute, { children: _jsx(AccountingPage, {}) }) }), _jsx(Route, { path: "/recommendations", element: _jsx(ProtectedRoute, { children: _jsx(RecommendationsPage, {}) }) }), _jsx(Route, { path: "/onboarding", element: _jsx(ProtectedRoute, { children: _jsx(OnboardingPage, {}) }) }), _jsxs(Route, { path: "/fuel", element: _jsx(ProtectedRoute, { children: _jsx(FuelLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(FuelDashboardPage, {}) }), _jsx(Route, { path: "map", element: _jsx(FuelMapPage, {}) }), _jsx(Route, { path: "vehicles", element: _jsx(FuelVehiclesPage, {}) }), _jsx(Route, { path: "vehicles/archived", element: _jsx(VehicleArchivePage, {}) }), _jsx(Route, { path: "vehicles/:id", element: _jsx(FuelVehicleDetailPage, {}) }), _jsx(Route, { path: "drivers", element: _jsx(FuelDriversPage, {}) }), _jsx(Route, { path: "stations", element: _jsx(FuelStationsPage, {}) }), _jsx(Route, { path: "recommendations", element: _jsx(RecommendationsPage, {}) }), _jsx(Route, { path: "analysis", element: _jsx(FuelAnalysisPage, {}) }), _jsx(Route, { path: "analysis/vehicle/:id", element: _jsx(FuelVehicleDetailPage, {}) }), _jsx(Route, { path: "anomalies", element: _jsx(FuelAnomaliesPage, {}) }), _jsx(Route, { path: "anomalies/:id", element: _jsx(FuelAnomalyDetailPage, {}) }), _jsx(Route, { path: "transactions", element: _jsx(FuelTransactionsPage, {}) }), _jsx(Route, { path: "validations", element: _jsx(FuelValidationsPage, {}) }), _jsx(Route, { path: "csrd", element: _jsx(CSRDPage, {}) }), _jsx(Route, { path: "budget", element: _jsx(FuelBudgetPage, {}) }), _jsx(Route, { path: "accounting", element: _jsx(AccountingPage, {}) }), _jsx(Route, { path: "prices", element: _jsx(FuelPricesPage, {}) }), _jsx(Route, { path: "reports", element: _jsx(FuelReportsPage, {}) }), _jsx(Route, { path: "settings", element: _jsx(FuelSettingsPage, {}) }), _jsx(Route, { path: "recalc-status", element: _jsx(FuelRecalcStatusPage, {}) }), _jsx(Route, { path: "recalc-audit", element: _jsx(FuelRecalcAuditPage, {}) }), _jsx(Route, { path: "recalc-audit/:id", element: _jsx(FuelRecalcAuditDetailPage, {}) }), _jsx(Route, { path: "api-diagnostics", element: _jsx(FuelApiDiagnosticsPage, {}) })] }), _jsx(Route, { path: "/help", element: _jsx(ProtectedRoute, { children: _jsx(HelpPage, {}) }) }), _jsx(Route, { path: "/audit-log", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(AuditLogPage, {}) }) }), _jsx(Route, { path: "/roles", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(RolesPermissionsPage, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(SuperAdminPage, {}) }) }), _jsx(Route, { path: "/api-docs", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(ApiDocsPage, {}) }) }), _jsx(Route, { path: "/sdk-examples", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(SdkExamplesPage, {}) }) }), _jsx(Route, { path: "/test-environment", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(TestEnvironmentPage, {}) }) }), _jsx(Route, { path: "/organizations", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(OrganizationAdminPage, {}) }) }), _jsx(Route, { path: "/api-diagnostics", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN], children: _jsx(ApiDiagnosticsPage, {}) }) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map