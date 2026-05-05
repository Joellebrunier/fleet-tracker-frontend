import { NavLink, Outlet } from 'react-router-dom'
import {
  Fuel,
  LayoutDashboard,
  Car,
  Receipt,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Settings,
  BarChart3,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/fuel', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/fuel/vehicles', label: 'Véhicules', icon: Car },
  { to: '/fuel/transactions', label: 'Transactions', icon: Receipt },
  { to: '/fuel/stations', label: 'Stations', icon: MapPin },
  { to: '/fuel/analysis', label: 'Analyse', icon: BarChart3 },
  { to: '/fuel/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { to: '/fuel/budget', label: 'Budget', icon: TrendingUp },
  { to: '/fuel/settings', label: 'Paramètres', icon: Settings },
]

export default function FuelLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* Sub-navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
        <div className="flex items-center gap-1 -mb-px overflow-x-auto">
          <div className="flex items-center gap-2 pr-4 py-3 border-r border-gray-200 dark:border-gray-700 mr-2">
            <Fuel className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-sm">Carburant</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
