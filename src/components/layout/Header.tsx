import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts'
import { useUIStore } from '@/stores/uiStore'
import { LogOut, User, Search, Command } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import NotificationCenter from './NotificationCenter'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const alertsCount = useUnacknowledgedAlertsCount()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
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
    <header className="sticky top-0 z-40 border-b border-[#1F1F2E] bg-[#0A0A0F]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Search */}
        <div className="flex items-center flex-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 rounded-[var(--tz-radius)] bg-[#12121A] border border-[#1F1F2E] px-4 py-2 text-[#44445A] hover:border-[#2A2A3D] hover:text-[#6B6B80] transition-all duration-200 max-w-sm w-full group"
          >
            <Search size={16} className="shrink-0" />
            <span className="text-sm font-medium">Rechercher...</span>
            <div className="ml-auto flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
              <kbd className="text-[10px] font-mono bg-[#1A1A25] border border-[#2A2A3D] rounded px-1.5 py-0.5">⌘K</kbd>
            </div>
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationCenter />

          {/* User */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 rounded-[var(--tz-radius-sm)] px-3 py-1.5 hover:bg-[#1A1A25] transition-all duration-200 group"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] flex items-center justify-center text-xs font-bold font-syne shadow-[0_0_12px_rgba(0,229,204,0.2)] group-hover:shadow-[0_0_20px_rgba(0,229,204,0.3)] transition-shadow">
                {user && getInitials(`${user.firstName} ${user.lastName}`)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-[#F0F0F5] font-syne leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-[#44445A] font-mono mt-0.5">{user?.role}</p>
              </div>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-[var(--tz-radius)] border border-[#1F1F2E] bg-[#12121A] shadow-[0_8px_48px_rgba(0,0,0,0.5)] animate-fade-in overflow-hidden">
                <button
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6B6B80] hover:bg-[#1A1A25] hover:text-[#F0F0F5] transition-colors"
                >
                  <User size={16} />
                  <span className="font-medium">Profil</span>
                </button>
                <div className="h-px bg-[#1F1F2E]" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#FF4D6A] hover:bg-[rgba(255,77,106,0.08)] transition-colors"
                >
                  <LogOut size={16} />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 rounded-[var(--tz-radius-lg)] border border-[#2A2A3D] bg-[#12121A] shadow-[0_8px_48px_rgba(0,0,0,0.5)] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1F1F2E]">
              <Search size={18} className="text-[#00E5CC] shrink-0" />
              <input
                type="text"
                placeholder="Rechercher véhicules, conducteurs, alertes..."
                className="flex-1 bg-transparent text-[#F0F0F5] text-sm font-medium placeholder:text-[#44445A] focus:outline-none font-syne"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="text-[10px] font-mono text-[#44445A] bg-[#1A1A25] border border-[#2A2A3D] rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="p-4 text-center text-sm text-[#44445A]">
              Tapez pour rechercher...
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
