import { useVehicles } from '@/hooks/useVehicles'
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, RefreshCw, Settings, Moon, Sun } from 'lucide-react'
import { VehicleStatus } from '@/types/vehicle'

export default function StatusBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const { data: vehiclesData } = useVehicles({ limit: 1000 })
  const alertsCount = useUnacknowledgedAlertsCount()

  // Calculate vehicle statistics
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['alert-stats'] })
  }

  return (
    <div className="bg-black text-white">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-bold tracking-wider">TRACKZONE</h1>
                <p className="text-xs text-slate-500 font-semibold">by MATÉRIEL TECH+</p>
              </div>
              <p className="text-xs text-slate-400 font-semibold">FLEET MANAGEMENT — GÉOLOCALISATION</p>
            </div>
          </div>

          {/* Center: Vehicle Counters */}
          <div className="flex items-center gap-6 flex-1 justify-center">
            {/* Total Vehicles */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">VÉHICULES</span>
              <span className="border border-slate-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {totalVehicles}
              </span>
            </div>

            {/* Moving - Green */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">EN MOUVEMENT</span>
              <span className="border border-green-500 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                {movingVehicles}
              </span>
            </div>

            {/* Stopped - Amber */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">À L'ARRÊT</span>
              <span className="border border-amber-500 text-amber-400 px-3 py-1 rounded-full text-sm font-semibold">
                {stoppedVehicles}
              </span>
            </div>

            {/* Not Located - Red */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">NON LOCALISÉS</span>
              <span className="border border-red-500 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                {notLocatedVehicles}
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Alerts Button */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Bell size={18} />
              <span>Alertes</span>
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {alertsCount > 99 ? '99+' : alertsCount}
                </span>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 transition-colors"
              title="Rafraîchir les données"
            >
              <RefreshCw size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Settings Icon */}
            <button
              onClick={() => navigate('/settings')}
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 transition-colors"
              title="Paramètres"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
