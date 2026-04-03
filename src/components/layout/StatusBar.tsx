import { useState, useEffect } from 'react'
import { useVehicles } from '@/hooks/useVehicles'
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, RefreshCw, Settings, Moon, Sun } from 'lucide-react'
import { VehicleStatus } from '@/types/vehicle'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-sm text-[#6B6B80] tabular-nums tracking-wider">
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function StatusPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-[11px] font-semibold tracking-[0.15em] text-[#44445A] uppercase font-syne hidden xl:inline">
        {label}
      </span>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(0,229,204,0.1)]"
        style={{ borderColor: color + '40', background: color + '08' }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full animate-dot-pulse"
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        />
        <span className="text-sm font-bold font-mono tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  )
}

export default function StatusBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const { data: vehiclesData } = useVehicles({ limit: 1000 })
  const alertsCount = useUnacknowledgedAlertsCount()

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
    <div className="bg-[#0A0A0F] border-b border-[#1F1F2E]">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Vehicle Status Counters */}
          <div className="flex items-center gap-4 stagger-children">
            <StatusPill label="Total" value={totalVehicles} color="#F0F0F5" />
            <StatusPill label="En route" value={movingVehicles} color="#00E5CC" />
            <StatusPill label="Arrêt" value={stoppedVehicles} color="#FFB547" />
            <StatusPill label="Hors ligne" value={notLocatedVehicles} color="#FF4D6A" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <LiveClock />

            <div className="w-px h-4 bg-[#1F1F2E] mx-1" />

            {/* Alerts */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative flex items-center gap-1.5 rounded-[var(--tz-radius-sm)] px-2.5 py-1.5 text-[#6B6B80] hover:text-[#F0F0F5] hover:bg-[#1A1A25] transition-all duration-200"
            >
              <Bell size={16} />
              {alertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF4D6A] text-[#0A0A0F] text-[10px] font-bold font-mono rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 animate-count-up shadow-[0_0_8px_rgba(255,77,106,0.4)]">
                  {alertsCount > 99 ? '99+' : alertsCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="rounded-[var(--tz-radius-sm)] p-1.5 text-[#44445A] hover:text-[#00E5CC] hover:bg-[rgba(0,229,204,0.08)] transition-all duration-200 active:rotate-180"
              title="Rafraîchir"
            >
              <RefreshCw size={15} />
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="rounded-[var(--tz-radius-sm)] p-1.5 text-[#44445A] hover:text-[#F0F0F5] hover:bg-[#1A1A25] transition-all duration-200"
              title="Paramètres"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
