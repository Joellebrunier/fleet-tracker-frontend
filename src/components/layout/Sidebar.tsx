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
  Cpu,
  HelpCircle,
  Lock,
  FileCode,
  Code,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user, hasRole } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    { label: 'Dashboard', icon: Home, path: '/', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'Carte', icon: Map, path: '/map', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'Véhicules', icon: Truck, path: '/vehicles', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'Groupes', icon: FolderTree, path: '/vehicle-groups', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
    { label: 'Conducteurs', icon: Users, path: '/drivers', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
    { label: 'Appareils', icon: Cpu, path: '/devices', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'Géoclôtures', icon: Zap, path: '/geofences', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
    { label: 'Alertes', icon: AlertCircle, path: '/alerts', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'Rapports', icon: BarChart3, path: '/reports', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
  ]

  const adminItems = [
    { label: 'API Docs', icon: FileCode, path: '/api-docs', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'SDK', icon: Code, path: '/sdk-examples', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'Test', icon: FlaskConical, path: '/test-environment', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'Rôles', icon: Lock, path: '/roles', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'Audit', icon: Shield, path: '/audit-log', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'Admin', icon: Shield, path: '/admin', roles: [UserRole.SUPER_ADMIN] },
  ]

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role as UserRole))
  )
  const visibleAdminItems = adminItems.filter((item) =>
    item.roles.some((role) => hasRole(role as UserRole))
  )

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]'

  const NavLink = ({ item }: { item: typeof menuItems[0] }) => {
    const Icon = item.icon
    const active = isActive(item.path)
    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'group relative flex items-center gap-3 rounded-[var(--tz-radius-sm)] px-3 py-2.5 transition-all duration-200',
          active
            ? 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]'
            : 'text-[#6B6B80] hover:bg-[#1A1A25] hover:text-[#F0F0F5]'
        )}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#00E5CC] shadow-[0_0_8px_rgba(0,229,204,0.5)]" />
        )}
        <Icon size={18} className={cn('shrink-0 transition-colors', active && 'drop-shadow-[0_0_6px_rgba(0,229,204,0.4)]')} />
        {!collapsed && (
          <span className="text-sm font-medium tracking-wide truncate">{item.label}</span>
        )}
        {/* Tooltip for collapsed */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2.5 py-1 rounded-md bg-[#1A1A25] border border-[#1F1F2E] text-xs text-[#F0F0F5] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {item.label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-40 rounded-[var(--tz-radius-sm)] bg-[#12121A] border border-[#1F1F2E] p-2 text-[#F0F0F5] lg:hidden hover:bg-[#1A1A25] transition-colors"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#1F1F2E] bg-[#0A0A0F] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0',
          sidebarWidth,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="border-b border-[#1F1F2E] p-4 flex items-center gap-3">
          {/* Logo mark */}
          <div className="shrink-0 w-9 h-9 rounded-[var(--tz-radius-sm)] bg-gradient-to-br from-[#00E5CC] to-[#00C4B0] flex items-center justify-center shadow-[0_0_16px_rgba(0,229,204,0.2)]">
            <span className="text-[#0A0A0F] font-extrabold text-sm tracking-tighter font-syne">FT</span>
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <h1 className="text-base font-bold tracking-[0.15em] text-[#F0F0F5] font-syne leading-none">FLEET TRACKER</h1>
              <p className="text-[10px] font-medium tracking-[0.2em] text-[#44445A] mt-0.5 font-mono uppercase">Matériel Tech+</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5 no-scrollbar">
          {visibleMenuItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}

          {visibleAdminItems.length > 0 && (
            <>
              <div className="my-3 mx-3">
                <div className="h-px bg-gradient-to-r from-transparent via-[#1F1F2E] to-transparent" />
                {!collapsed && (
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-[#44445A] mt-3 mb-1 px-1 uppercase font-mono">Admin</p>
                )}
              </div>
              {visibleAdminItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[#1F1F2E] p-2.5 space-y-0.5">
          <NavLink item={{ label: 'Aide', icon: HelpCircle, path: '/help', roles: [] }} />
          <NavLink item={{ label: 'Paramètres', icon: Settings, path: '/settings', roles: [] }} />

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-3 rounded-[var(--tz-radius-sm)] px-3 py-2 text-[#44445A] hover:text-[#6B6B80] hover:bg-[#1A1A25] transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="text-xs font-medium tracking-wide">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
