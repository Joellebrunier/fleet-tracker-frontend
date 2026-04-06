import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts'
import { useVehicles } from '@/hooks/useVehicles'
import { useUIStore } from '@/stores/uiStore'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, User, Search, Bell, RefreshCw, Settings, Menu, Building2, ChevronDown, Check, Navigation, WifiOff, Wifi, MapPin } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { VehicleStatus } from '@/types/vehicle'

function StatusChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 transition-colors cursor-default">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-white/60 text-[11px] font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white text-sm font-bold tabular-nums">{value}</span>
    </div>
  )
}

export default function Header() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout, organizations, switchOrganization } = useAuth()
  const alertsCount = useUnacknowledgedAlertsCount()
  const { data: vehiclesData } = useVehicles({ limit: 1000 })
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const orgMenuRef = useRef<HTMLDivElement>(null)

  const currentOrgName = (organizations || []).find(
    (o: any) => (o.organizationId || o.id) === user?.organizationId
  )?.name || 'Organisation'

  const vehicles = vehiclesData?.data || []
  const totalVehicles = vehicles.length
  const movingVehicles = vehicles.filter(
    (v: any) => v.status === VehicleStatus.ACTIVE && v.currentSpeed && v.currentSpeed > 0
  ).length
  const stoppedVehicles = vehicles.filter(
    (v: any) => v.status === VehicleStatus.ACTIVE && (!v.currentSpeed || v.currentSpeed === 0)
  ).length
  const notLocatedVehicles = vehicles.filter(
    (v: any) => v.status === VehicleStatus.OFFLINE || !v.currentLat || !v.currentLng
  ).length

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    await queryClient.invalidateQueries({ queryKey: ['alert-stats'] })
    setTimeout(() => setIsRefreshing(false), 800)
  }

  // Close menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#1a2540] to-[#243154] h-14 flex items-center px-4 lg:px-6 shadow-lg">
        <div className="flex items-center justify-between w-full gap-4">
          {/* Left: Logo and branding */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Logo mark */}
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4361EE] to-[#3B52D3] flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/')}
            >
              <span className="text-white font-extrabold text-sm tracking-tight">FT</span>
            </div>

            {/* Branding text */}
            <div className="hidden sm:block cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-white font-bold text-[13px] tracking-widest leading-none">FLEET TRACKER</h1>
              <p className="text-blue-300/60 text-[10px] font-medium mt-0.5 tracking-wide">Géolocalisation temps réel</p>
            </div>
          </div>

          {/* Center: Vehicle Status Chips */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            <StatusChip icon={null} label="Total" value={totalVehicles} color="bg-blue-400" />
            <StatusChip icon={null} label="En route" value={movingVehicles} color="bg-emerald-400" />
            <StatusChip icon={null} label="Arrêt" value={stoppedVehicles} color="bg-amber-400" />
            <StatusChip icon={null} label="Hors ligne" value={notLocatedVehicles} color="bg-red-400" />
          </div>

          {/* Right: Controls and User */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-white/8 border border-white/10 text-white/50 hover:bg-white/12 hover:text-white/70 transition-all text-xs group"
            >
              <Search size={14} />
              <span className="hidden md:inline text-[11px]">Rechercher...</span>
              <kbd className="hidden md:inline text-[10px] font-mono bg-white/8 border border-white/10 px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
            </button>

            {/* Alerts */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Alertes"
            >
              <Bell size={17} />
              {alertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-[18px] min-w-[18px] flex items-center justify-center px-1 shadow-lg animate-pulse">
                  {alertsCount > 99 ? '99+' : alertsCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Rafraîchir les données"
            >
              <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Paramètres"
            >
              <Settings size={17} />
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Organization Switcher */}
            {organizations && organizations.length > 0 && (
              <div className="relative" ref={orgMenuRef}>
                <button
                  onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/8 border border-white/10 text-white/70 hover:bg-white/12 hover:text-white transition-all text-xs"
                >
                  <Building2 size={13} />
                  <span className="hidden md:inline max-w-[100px] truncate text-[11px] font-medium">{currentOrgName}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${orgMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {orgMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-50" style={{ animation: 'fadeInDown 0.15s ease-out' }}>
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Organisations</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {organizations.map((org: any) => {
                        const orgId = org.organizationId || org.id
                        const isActive = orgId === user?.organizationId
                        return (
                          <button
                            key={orgId}
                            onClick={async () => {
                              if (!isActive) {
                                try {
                                  await switchOrganization(orgId)
                                  queryClient.invalidateQueries()
                                } catch {}
                              }
                              setOrgMenuOpen(false)
                            }}
                            className={`flex items-center justify-between w-full px-4 py-2.5 text-left text-sm transition-all ${
                              isActive
                                ? 'bg-[#4361EE]/8 text-[#4361EE] font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-[#4361EE]/15 text-[#4361EE]' : 'bg-gray-100 text-gray-500'}`}>
                                {(org.name || 'O')[0]}
                              </div>
                              <span className="truncate text-[13px]">{org.name || orgId}</span>
                            </div>
                            {isActive && <Check size={14} className="text-[#4361EE] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity pl-1"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#6B8AFF] text-white flex items-center justify-center text-[11px] font-bold shadow-md">
                  {user && getInitials(`${user.firstName} ${user.lastName}`)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-[12px] font-semibold leading-none">
                    {user?.firstName}
                  </p>
                  <p className="text-white/40 text-[10px] mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden" style={{ animation: 'fadeInDown 0.15s ease-out' }}>
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <User size={15} className="text-gray-400" />
                      <span className="font-medium">Mon profil</span>
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Settings size={15} className="text-gray-400" />
                      <span className="font-medium">Paramètres</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeInDown 0.2s ease-out' }}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search size={18} className="text-[#4361EE] shrink-0" />
              <input
                type="text"
                placeholder="Rechercher véhicules, conducteurs, alertes..."
                className="flex-1 bg-transparent text-gray-900 text-sm font-medium placeholder:text-gray-300 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5">ESC</kbd>
            </div>
            <div className="px-5 py-8 text-center">
              <Search size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                Tapez pour rechercher...
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Véhicules, plaques d'immatriculation, conducteurs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS animation keyframes */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
