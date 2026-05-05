import { NavLink, Outlet } from 'react-router-dom'
import { Car, MapPin, Clock, Fuel, User, Home } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/driver-app', label: 'Accueil', icon: Home, end: true },
  { to: '/driver-app/vehicles', label: 'Véhicules', icon: Car },
  { to: '/driver-app/declare', label: 'Déclarer', icon: Fuel },
  { to: '/driver-app/stations', label: 'Stations', icon: MapPin },
  { to: '/driver-app/history', label: 'Historique', icon: Clock },
  { to: '/driver-app/profile', label: 'Profil', icon: User },
]

export default function DriverAppLayout() {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom navigation (mobile-style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 px-2 py-1 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
