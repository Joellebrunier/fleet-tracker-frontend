import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, AlertCircle, MapPin, Gauge, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTimeAgo } from '@/lib/utils'

interface Notification {
  id: string
  type: 'alert' | 'location' | 'status' | 'system'
  icon: React.ReactNode
  title: string
  message: string
  timestamp: string
  read: boolean
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

interface NotificationCenterState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
}

// Simple in-memory store for notifications (in real app, would use zustand)
const createNotificationStore = (): NotificationCenterState => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      icon: <AlertCircle size={16} />,
      title: 'Vehicle Speed Alert',
      message: 'Vehicle TR-001 exceeded speed limit on Highway 10',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      read: false,
      severity: 'high',
    },
    {
      id: '2',
      type: 'location',
      icon: <MapPin size={16} />,
      title: 'Geofence Breach',
      message: 'Vehicle TR-045 left designated geofence zone',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      read: false,
      severity: 'critical',
    },
    {
      id: '3',
      type: 'status',
      icon: <Gauge size={16} />,
      title: 'Low Fuel',
      message: 'Vehicle TR-032 fuel level below 25%',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      read: true,
    },
    {
      id: '4',
      type: 'system',
      icon: <Bell size={16} />,
      title: 'Maintenance Due',
      message: 'Vehicle TR-089 maintenance schedule coming up',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: true,
    },
  ])

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    addNotification: (notification: Omit<Notification, 'id' | 'read'>) => {
      const id = `n_${Date.now()}`
      setNotifications((prev) => [{ ...notification, id, read: false }, ...prev])
    },
    markAsRead: (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    },
    markAllAsRead: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    },
    removeNotification: (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    },
  }
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const store = createNotificationStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationColor = (type: string, severity?: string) => {
    if (severity === 'critical') return 'text-red-600'
    if (severity === 'high') return 'text-orange-500'
    if (type === 'alert') return 'text-red-500'
    if (type === 'location') return 'text-blue-500'
    if (type === 'status') return 'text-amber-500'
    return 'text-gray-500'
  }

  const getNotificationBgColor = (type: string, severity?: string) => {
    if (severity === 'critical') return 'bg-red-50'
    if (severity === 'high') return 'bg-orange-50'
    if (type === 'alert') return 'bg-red-50'
    if (type === 'location') return 'bg-blue-50'
    if (type === 'status') return 'bg-amber-50'
    return 'bg-gray-50'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell size={20} />
        {store.unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {store.unreadCount > 9 ? '9+' : store.unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {store.unreadCount > 0 && (
              <button
                onClick={() => store.markAllAsRead()}
                className="text-xs text-fleet-tracker-600 hover:text-fleet-tracker-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {store.notifications.length > 0 ? (
              store.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => store.markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 rounded-full p-2 ${getNotificationBgColor(
                        notification.type,
                        notification.severity
                      )}`}
                    >
                      <div
                        className={getNotificationColor(
                          notification.type,
                          notification.severity
                        )}
                      >
                        {notification.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        store.removeNotification(notification.id)
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell size={24} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {store.notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button className="w-full text-center text-sm font-medium text-fleet-tracker-600 hover:text-fleet-tracker-700">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
