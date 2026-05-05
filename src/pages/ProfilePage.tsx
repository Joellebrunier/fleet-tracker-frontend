import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { User, UserPreferences } from '@/types/user'
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Building2,
  Camera,
  Save,
  Lock,
  Bell,
  Globe,
  Gauge,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const orgId = user?.organizationId || ''

  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Preferences
  const [prefs, setPrefs] = useState<UserPreferences>({
    theme: 'light',
    locale: 'fr',
    notifications: { email: true, push: true, sms: false },
    speedUnit: 'kmh',
    distanceUnit: 'km',
    temperatureUnit: 'celsius',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setPhone(user.phone || '')
    }
  }, [user])

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setProfileMsg(null)
    try {
      const response = await apiClient.put(API_ROUTES.USER_DETAIL(orgId, user.id), {
        firstName,
        lastName,
        phone,
      })
      setUser({ ...user, firstName, lastName, phone })
      setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Erreur lors de la mise à jour' })
    } finally {
      setSaving(false)
    }
  }

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }
    setChangingPw(true)
    try {
      await apiClient.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      })
      setPwMsg({ type: 'success', text: 'Mot de passe modifié avec succès' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.message || 'Erreur lors du changement de mot de passe' })
    } finally {
      setChangingPw(false)
    }
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrateur',
    ADMIN: 'Administrateur',
    MANAGER: 'Gestionnaire',
    OPERATOR: 'Opérateur',
    DRIVER: 'Conducteur',
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Chargement du profil...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Camera className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Shield className="w-3 h-3" />
              {roleLabels[user.role] || user.role}
            </span>
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Informations personnelles
          </h2>
        </div>
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Changer le mot de passe */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-600" />
            Changer le mot de passe
          </h2>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
          </div>

          {pwMsg && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {pwMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPw}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              <Lock className="w-4 h-4" />
              {changingPw ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </div>

      {/* Préférences */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            Préférences
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
              <Bell className="w-4 h-4" /> Notifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'email' as const, label: 'Email' },
                { key: 'push' as const, label: 'Push navigateur' },
                { key: 'sms' as const, label: 'SMS' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.notifications[key]}
                    onChange={(e) =>
                      setPrefs({
                        ...prefs,
                        notifications: { ...prefs.notifications, [key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Unités */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
              <Gauge className="w-4 h-4" /> Unités
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vitesse</label>
                <select
                  value={prefs.speedUnit}
                  onChange={(e) => setPrefs({ ...prefs, speedUnit: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="kmh">km/h</option>
                  <option value="mph">mph</option>
                  <option value="kn">Noeuds</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Distance</label>
                <select
                  value={prefs.distanceUnit}
                  onChange={(e) => setPrefs({ ...prefs, distanceUnit: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="km">Kilomètres</option>
                  <option value="mi">Miles</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Température</label>
                <select
                  value={prefs.temperatureUnit}
                  onChange={(e) => setPrefs({ ...prefs, temperatureUnit: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Format date/heure */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
              <Calendar className="w-4 h-4" /> Format date & heure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format de date</label>
                <select
                  value={prefs.dateFormat}
                  onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="dd/MM/yyyy">31/12/2026 (FR)</option>
                  <option value="MM/dd/yyyy">12/31/2026 (US)</option>
                  <option value="yyyy-MM-dd">2026-12-31 (ISO)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Format d'heure</label>
                <select
                  value={prefs.timeFormat}
                  onChange={(e) => setPrefs({ ...prefs, timeFormat: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="24h">24 heures (14:30)</option>
                  <option value="12h">12 heures (2:30 PM)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations du compte */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Informations du compte
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">ID utilisateur</span>
              <p className="font-mono text-xs text-gray-700 mt-0.5">{user.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Organisation</span>
              <p className="font-medium text-gray-700 mt-0.5">{user.organizationId}</p>
            </div>
            <div>
              <span className="text-gray-500">Rôle</span>
              <p className="font-medium text-gray-700 mt-0.5">{roleLabels[user.role] || user.role}</p>
            </div>
            <div>
              <span className="text-gray-500">Statut</span>
              <p className="mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </p>
            </div>
            <div>
              <span className="text-gray-500">Dernière connexion</span>
              <p className="text-gray-700 mt-0.5">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Compte créé le</span>
              <p className="text-gray-700 mt-0.5">
                {user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
