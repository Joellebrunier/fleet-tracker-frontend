import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts'
import { useUIStore } from '@/stores/uiStore'
import { LogOut, User, Moon, Sun, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import NotificationCenter from './NotificationCenter'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useUIStore()
  const alertsCount = useUnacknowledgedAlertsCount()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4 flex-1">
          {searchOpen && (
            <div className="flex-1 max-w-md">
              <input
                type="search"
                placeholder="Search vehicles, drivers, alerts..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-fleet-tracker-500 focus:outline-none focus:ring-2 focus:ring-fleet-tracker-500 focus:ring-opacity-20"
                onBlur={() => setSearchOpen(false)}
                autoFocus
              />
            </div>
          )}
          {!searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Search size={20} />
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-6">
          {/* Notifications */}
          <NotificationCenter />

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-fleet-tracker-600 text-white flex items-center justify-center text-sm font-bold">
                {user && getInitials(`${user.firstName} ${user.lastName}`)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={() => {
                    navigate('/settings')
                    setUserMenuOpen(false)
                  }}
                  className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                >
                  <User size={16} />
                  <span>Profile Settings</span>
                </button>
                <div className="border-t border-gray-200"></div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
