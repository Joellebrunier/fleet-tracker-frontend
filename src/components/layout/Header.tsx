import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts'
import { useVehicles } from '@/hooks/useVehicles'
import { useUIStore } from '@/stores/uiStore'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, User, Search, Bell, RefreshCw, Settings, Menu } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { VehicleStatus } from '@/types/vehicle'

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-[#6B7280] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] border border-[#4361EE]/20">
        <span className="text-sm font-bold font-mono text-[#4361EE]">
          {value}
        </span>
      </div>
    </div>
  )
}

export default function Header() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const alertsCount = useUnacknowledgedAlertsCount()
  const { data: vehiclesData } = useVehicles({ limit: 1000 })
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['alert-stats'] })
  }

  // Close menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
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
      <header className="sticky top-0 z-40 bg-[#1E2A4A] border-b border-[#1E2A4A]/10 h-14 flex items-center px-6">
        <div className="flex items-center justify-between w-full gap-6">
          {/* Left: Logo and branding */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg bg-[#4361EE] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">FT</span>
            </div>

            {/* Branding text */}
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-sm tracking-wide">FLEET TRACKER</h1>
              <p className="text-[#9CA3AF] text-[10px] font-medium">GÉOLOCALISATION TEMPS RÉEL</p>
            </div>
          </div>

          {/* Center: Vehicle Status Pills */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <StatusPill label="VÉHICULES" value={totalVehicles} />
            <StatusPill label="EN MOUVEMENT" value={movingVehicles} />
            <StatusPill label="À L'ARRÊT" value={stoppedVehicles} />
            <StatusPill label="NON LOCALISÉS" value={notLocatedVehicles} />
          </div>

          {/* Right: Controls and User */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-sm group"
            >
              <Search size={16} />
              <span className="hidden md:inline">Rechercher</span>
              <kbd className="hidden md:inline text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded ml-auto">⌘K</kbd>
            </button>

            {/* Alerts */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Alertes"
            >
              <Bell size={18} />
              {alertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                  {alertsCount > 99 ? '99+' : alertsCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={18} />
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Paramètres"
            >
              <Settings size={18} />
            </button>

            {/* User Menu */}
            <div className="relative border-l border-white/10 pl-4" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="h-8 w-8 rounded-full bg-[#4361EE] text-white flex items-center justify-center text-xs font-bold">
                  {user && getInitials(`${user.firstName} ${user.lastName}`)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-xs font-semibold leading-none">
                    {user?.firstName}
                  </p>
                  <p className="text-white/60 text-[10px] font-mono mt-0.5">{user?.role}</p>
                </div>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg animate-fade-in overflow-hidden">
                  <button
                    onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} />
                    <span className="font-medium">Profil</span>
                  </button>
                  <div className="h-px bg-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 rounded-lg border border-gray-200 bg-white shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <Search size={18} className="text-[#4361EE] shrink-0" />
              <input
                type="text"
                placeholder="Rechercher véhicules, conducteurs, alertes..."
                className="flex-1 bg-transparent text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="p-4 text-center text-sm text-gray-500">
              Tapez pour rechercher...
            </div>
          </div>
        </div>
      )}
    </>
  )
}
