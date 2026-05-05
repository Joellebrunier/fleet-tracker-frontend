import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Search,
  AlertTriangle, Info, MapPin, Fuel, Car, Shield,
  Settings, Filter, MailOpen, Clock
} from 'lucide-react'

type NotifType = 'alert' | 'geofence' | 'fuel' | 'maintenance' | 'system' | 'security'
type NotifPriority = 'low' | 'normal' | 'high' | 'critical'

interface Notification {
  id: string
  type: NotifType
  priority: NotifPriority
  title: string
  message: string
  read: boolean
  createdAt: string
  vehicleName?: string
  actionUrl?: string
}

const TYPE_CONFIG: Record<NotifType, { label: string; icon: typeof Bell; color: string; bg: string }> = {
  alert: { label: 'Alerte', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  geofence: { label: 'Géozone', icon: MapPin, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  fuel: { label: 'Carburant', icon: Fuel, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  maintenance: { label: 'Maintenance', icon: Car, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  system: { label: 'Système', icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
  security: { label: 'Sécurité', icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
}

const PRIORITY_STYLES: Record<NotifPriority, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const PRIORITY_LABELS: Record<NotifPriority, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  critical: 'Critique',
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alert',
    priority: 'critical',
    title: 'Excès de vitesse détecté',
    message: 'Le véhicule Renault Clio (HJ-180-PW) a atteint 142 km/h sur l\'A8. Limite: 130 km/h.',
    read: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    vehicleName: 'Renault Clio',
  },
  {
    id: '2',
    type: 'geofence',
    priority: 'high',
    title: 'Sortie de zone autorisée',
    message: 'Le véhicule Peugeot 308 (FP-456-AB) est sorti de la zone "Nice Centre" à 14:23.',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    vehicleName: 'Peugeot 308',
  },
  {
    id: '3',
    type: 'fuel',
    priority: 'normal',
    title: 'Consommation anormale',
    message: 'La consommation du Citroën Berlingo est 25% supérieure à la moyenne cette semaine (9.2 L/100km).',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    vehicleName: 'Citroën Berlingo',
  },
  {
    id: '4',
    type: 'maintenance',
    priority: 'high',
    title: 'Révision à planifier',
    message: 'Le Renault Kangoo (DJ-321-MN) a atteint 49 500 km. Prochaine révision recommandée à 50 000 km.',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    vehicleName: 'Renault Kangoo',
  },
  {
    id: '5',
    type: 'system',
    priority: 'low',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version du firmware est disponible pour 3 traceurs GPS de votre flotte.',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '6',
    type: 'security',
    priority: 'normal',
    title: 'Nouvelle connexion détectée',
    message: 'Un nouvel appareil (iPhone 15 - Safari) s\'est connecté à votre compte depuis Nice, France.',
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '7',
    type: 'alert',
    priority: 'normal',
    title: 'Moteur allumé hors horaires',
    message: 'Le véhicule Ford Transit (GK-789-CD) a démarré à 23:42, hors des horaires autorisés.',
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    vehicleName: 'Ford Transit',
  },
  {
    id: '8',
    type: 'geofence',
    priority: 'low',
    title: 'Entrée en zone client',
    message: 'Le Renault Clio (HJ-180-PW) est entré dans la zone "Dépôt Carros" à 08:15.',
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    vehicleName: 'Renault Clio',
  },
]

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<NotifType | 'all'>('all')
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')
  const [showSettings, setShowSettings] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false
    if (filterRead === 'unread' && n.read) return false
    if (filterRead === 'read' && !n.read) return false
    if (search) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.vehicleName?.toLowerCase().includes(q)
    }
    return true
  })

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Settings panel
  const [notifSettings, setNotifSettings] = useState({
    emailAlerts: true,
    emailGeofence: true,
    emailFuel: false,
    emailMaintenance: true,
    pushEnabled: true,
    pushSpeed: true,
    pushGeofence: true,
    pushFuel: false,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '07:00',
  })

  if (showSettings) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Paramètres de notifications</h1>
            <p className="text-sm text-gray-500 mt-1">Configurez comment et quand vous recevez des notifications</p>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(false)}>
            Retour
          </Button>
        </div>

        {/* Email notifications */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MailOpen className="h-4 w-4 text-blue-500" />
              Notifications par email
            </h3>
            {[
              { key: 'emailAlerts', label: 'Alertes (vitesse, moteur, etc.)' },
              { key: 'emailGeofence', label: 'Entrée/sortie de géozones' },
              { key: 'emailFuel', label: 'Anomalies carburant' },
              { key: 'emailMaintenance', label: 'Rappels de maintenance' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">{item.label}</span>
                <div
                  className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                    (notifSettings as any)[item.key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() =>
                    setNotifSettings((p) => ({ ...p, [item.key]: !(p as any)[item.key] }))
                  }
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      (notifSettings as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Push notifications */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-500" />
              Notifications push
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium">Activer les notifications push</span>
              <div
                className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                  notifSettings.pushEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={() => setNotifSettings((p) => ({ ...p, pushEnabled: !p.pushEnabled }))}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    notifSettings.pushEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
            {notifSettings.pushEnabled && (
              <>
                {[
                  { key: 'pushSpeed', label: 'Alertes de vitesse' },
                  { key: 'pushGeofence', label: 'Alertes géozone' },
                  { key: 'pushFuel', label: 'Alertes carburant' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer pl-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <div
                      className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                        (notifSettings as any)[item.key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      onClick={() =>
                        setNotifSettings((p) => ({ ...p, [item.key]: !(p as any)[item.key] }))
                      }
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          (notifSettings as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiet hours */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Heures calmes
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Ne pas déranger pendant les heures calmes</span>
              <div
                className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                  notifSettings.quietHoursEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={() => setNotifSettings((p) => ({ ...p, quietHoursEnabled: !p.quietHoursEnabled }))}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    notifSettings.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
            {notifSettings.quietHoursEnabled && (
              <div className="flex items-center gap-3 pl-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">De</label>
                  <Input
                    type="time"
                    value={notifSettings.quietStart}
                    onChange={(e) => setNotifSettings((p) => ({ ...p, quietStart: e.target.value }))}
                    className="w-28"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">À</label>
                  <Input
                    type="time"
                    value={notifSettings.quietEnd}
                    onChange={(e) => setNotifSettings((p) => ({ ...p, quietEnd: e.target.value }))}
                    className="w-28"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-500" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer lu
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-1" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Tous les types</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Toutes</option>
          <option value="unread">Non lues</option>
          <option value="read">Lues</option>
        </select>
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <BellOff className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">Aucune notification</p>
              <p className="text-sm text-gray-400 mt-1">
                {filterType !== 'all' || filterRead !== 'all' || search
                  ? 'Essayez de modifier vos filtres'
                  : 'Vous êtes à jour !'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type]
            const Icon = cfg.icon
            return (
              <Card
                key={notif.id}
                className={`transition hover:shadow-md cursor-pointer ${
                  !notif.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`text-sm font-medium truncate ${!notif.read ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notif.title}
                        </h3>
                        <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[notif.priority]}`}>
                          {PRIORITY_LABELS[notif.priority]}
                        </Badge>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                        {notif.vehicleName && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {notif.vehicleName}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notif.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                          title="Marquer comme lu"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
