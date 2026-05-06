import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useVehicles } from '@/hooks/useVehicles'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'
import { RefreshCw, ChevronDown, Shield, FileText, Activity, Bug, Users, BookOpen, Code, FlaskConical } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface NavTab {
  label: string
  path: string
  roles: UserRole[]
  countKey?: string
}

interface AdminSubItem {
  label: string
  path: string
  icon: React.ReactNode
}

const TAB_ITEMS: NavTab[] = [
  { label: 'CARTE', path: '/map', countKey: 'map', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'TABLEAU DE BORD', path: '/', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'ALERTES', path: '/alerts', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'FOURRIÈRES', path: '/fourrieres', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'RAPPORTS', path: '/reports', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'CONDUCTEURS', path: '/drivers', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
  { label: 'CARBURANT', path: '/fuel', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'MAINTENANCE', path: '/maintenance', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'CSRD', path: '/csrd', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
  { label: 'COMPTABILITÉ', path: '/accounting', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
  { label: 'SUPPORT', path: '/help', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
]

const ADMIN_ITEMS: AdminSubItem[] = [
  { label: 'Super Admin', path: '/admin', icon: <Shield size={14} /> },
  { label: 'Équipe / Organisations', path: '/organizations', icon: <Users size={14} /> },
  { label: 'Rôles & Permissions', path: '/roles', icon: <Users size={14} /> },
  { label: 'Journal d\'audit', path: '/audit-log', icon: <FileText size={14} /> },
  { label: 'Diagnostics API', path: '/api-diagnostics', icon: <Activity size={14} /> },
  { label: 'Documentation API', path: '/api-docs', icon: <BookOpen size={14} /> },
  { label: 'Exemples SDK', path: '/sdk-examples', icon: <Code size={14} /> },
  { label: 'Environnement de test', path: '/test-environment', icon: <FlaskConical size={14} /> },
]

export default function TabNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const { data: vehiclesData } = useVehicles({ limit: 1000 })
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  const vehiclesWithGps = (vehiclesData?.data || []).filter((v: any) => v.currentLat && v.currentLng).length

  const visibleTabs = TAB_ITEMS.filter((tab) =>
    tab.roles.some((role) => hasRole(role as UserRole))
  )

  const isAdmin = hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isAdminActive = ADMIN_ITEMS.some((item) => isActive(item.path))

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['alert-stats'] })
  }

  // Close admin menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="sticky top-14 z-30 bg-white border-b border-gray-200 h-11 flex items-center justify-between px-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <button
              key={tab.path}
              onClick={(e) => { e.preventDefault(); navigate(tab.path) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold whitespace-nowrap transition-all',
                active
                  ? 'bg-[#4361EE] text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              )}
            >
              {tab.label}
              {tab.countKey === 'map' && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {vehiclesWithGps}
                </span>
              )}
            </button>
          )
        })}

        {/* Admin dropdown */}
        {isAdmin && (
          <div className="relative" ref={adminMenuRef}>
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold whitespace-nowrap transition-all',
                isAdminActive
                  ? 'bg-[#4361EE] text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              )}
            >
              <Shield size={13} />
              ADMINISTRATION
              <ChevronDown size={12} className={`transition-transform duration-200 ${adminMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {adminMenuOpen && (
              <div
                className="absolute left-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-50"
                style={{ animation: 'fadeInDown 0.15s ease-out' }}
              >
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Administration</p>
                </div>
                <div className="py-1">
                  {ADMIN_ITEMS.map((item) => {
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path)
                          setAdminMenuOpen(false)
                        }}
                        className={cn(
                          'flex items-center gap-2.5 w-full px-4 py-2 text-left text-[13px] transition-colors',
                          active
                            ? 'bg-[#4361EE]/8 text-[#4361EE] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <span className={active ? 'text-[#4361EE]' : 'text-gray-400'}>{item.icon}</span>
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleRefresh}
        className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-[12px] font-semibold transition-all shrink-0"
      >
        <RefreshCw size={13} />
        RAFRAÎCHIR
      </button>

      {/* Keyframe for dropdown animation */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}
