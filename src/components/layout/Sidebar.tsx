import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import {
  Menu,
  X,
  Map,
  Truck,
  AlertCircle,
  Settings,
  BarChart3,
  Zap,
  Shield,
  Home,
  Users,
  FolderTree,
} from 'lucide-react'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user, hasRole } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Carte',
      icon: Map,
      path: '/map',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.OPERATOR, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Vehicules',
      icon: Truck,
      path: '/vehicles',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Groupes',
      icon: FolderTree,
      path: '/vehicle-groups',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Conducteurs',
      icon: Users,
      path: '/drivers',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Geofences',
      icon: Zap,
      path: '/geofences',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Alertes',
      icon: AlertCircle,
      path: '/alerts',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Rapports',
      icon: BarChart3,
      path: '/reports',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
    },
  ]

  const adminItems = [
    {
      label: 'Administration',
      icon: Shield,
      path: '/admin',
      roles: [UserRole.SUPER_ADMIN],
    },
  ]

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role as UserRole))
  )

  const visibleAdminItems = adminItems.filter((item) =>
    item.roles.some((role) => hasRole(role as UserRole))
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-40 rounded-md bg-blue-600 p-2 text-white lg:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-blue-600">TrackZone</h1>
          <p className="text-xs text-gray-500">Fleet Management System</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-4 py-2.5 transition-colors',
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Divider */}
          {visibleAdminItems.length > 0 && (
            <>
              <div className="my-3 border-t border-gray-200"></div>
              {visibleAdminItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 rounded-lg px-4 py-2.5 transition-colors',
                      isActive(item.path)
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="absolute bottom-0 w-full border-t border-gray-200 p-3">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-4 py-2.5 transition-colors',
              isActive('/settings')
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Paramètres</span>
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  )
}
