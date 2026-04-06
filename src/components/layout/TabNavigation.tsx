import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'
import {
  Map,
  LayoutDashboard,
  Bell,
  Shield,
  Building2,
  Users,
  HelpCircle,
  Truck,
} from 'lucide-react'

interface NavTab {
  label: string
  path: string
  roles: UserRole[]
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const TAB_ITEMS: NavTab[] = [
  { label: 'Carte', path: '/map', icon: Map, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'Tableau de bord', path: '/', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'Véhicules', path: '/vehicles', icon: Truck, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'Alertes', path: '/alerts', icon: Bell, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
  { label: 'Administration', path: '/admin', icon: Shield, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { label: 'Organisations', path: '/organizations', icon: Building2, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { label: 'Conducteurs', path: '/drivers', icon: Users, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
  { label: 'Support', path: '/help', icon: HelpCircle, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
]

export default function TabNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const visibleTabs = TAB_ITEMS.filter((tab) =>
    tab.roles.some((role) => hasRole(role as UserRole))
  )

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="sticky top-14 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center h-11 px-4 gap-1 overflow-x-auto no-scrollbar">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.path)
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={(e) => {
                e.preventDefault()
                navigate(tab.path)
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-200',
                active
                  ? 'bg-[#4361EE]/10 text-[#4361EE] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
            >
              <Icon size={15} className={active ? 'text-[#4361EE]' : 'text-gray-400'} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
