import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, Database, MapPin, Globe, Copy, RefreshCw, Eye, EyeOff, Wifi, Server, User, Bell, Palette } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme, locale, setLocale } = useUIStore()
  const [isEditing, setIsEditing] = useState(false)

  // GPS Provider states
  const [providers, setProviders] = useState({
    flespi: { enabled: false, token: '', channelId: '' },
    echoes: { enabled: false, url: '', privacyKey: '' },
    keeptrace: { enabled: false, apiKey: '' },
    ubiwan: { enabled: false, endpoint: '', credentials: '' },
  })

  // API Key state
  const [apiKey, setApiKey] = useState('ft_key_' + 'x'.repeat(24))
  const [showApiKey, setShowApiKey] = useState(false)

  // Data Retention state
  const [dataRetention, setDataRetention] = useState('90')

  // Map Defaults state
  const [mapDefaults, setMapDefaults] = useState({
    centerLat: '43.7',
    centerLng: '7.12',
    zoom: '12',
    tileLayer: 'streets',
  })

  const handleProviderToggle = (provider: string) => {
    setProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider as keyof typeof prev], enabled: !prev[provider as keyof typeof prev].enabled }
    }))
  }

  const handleProviderChange = (provider: string, field: string, value: string) => {
    setProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider as keyof typeof prev], [field]: value }
    }))
  }

  const handleMapDefaultChange = (field: string, value: string) => {
    setMapDefaults(prev => ({ ...prev, [field]: value }))
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
  }

  const regenerateApiKey = () => {
    const newKey = 'ft_key_' + Math.random().toString(36).substr(2, 24)
    setApiKey(newKey)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Profil
          </CardTitle>
          <CardDescription>Gérez les informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <Input
              type="text"
              value={user?.firstName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <Input
              type="text"
              value={user?.lastName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input type="email" value={user?.email || ''} disabled className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rôle</label>
            <Input type="text" value={user?.role || ''} disabled className="mt-1" />
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full"
            variant={isEditing ? 'default' : 'outline'}
          >
            {isEditing ? 'Enregistrer' : 'Modifier le profil'}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} />
            Préférences
          </CardTitle>
          <CardDescription>Personnalisez votre expérience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Thème</label>
            <div className="flex gap-4">
              {['light', 'dark'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t as 'light' | 'dark')}
                  className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                    theme === t
                      ? 'bg-fleet-tracker-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t === 'light' ? 'Clair' : 'Sombre'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Langue</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Unité de vitesse</label>
            <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <option value="kmh">Kilomètres par heure (km/h)</option>
              <option value="mph">Miles par heure (mph)</option>
              <option value="kn">Nœuds (kn)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Unité de distance</label>
            <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <option value="km">Kilomètres (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </CardTitle>
          <CardDescription>Contrôlez la réception de vos alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Notifications par email', key: 'email' },
            { label: 'Notifications push', key: 'push' },
            { label: 'Notifications SMS', key: 'sms' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{item.label}</label>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
          ))}
          <Button className="w-full mt-4">Enregistrer les préférences</Button>
        </CardContent>
      </Card>

      {/* GPS Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi size={20} />
            Fournisseurs GPS
          </CardTitle>
          <CardDescription>Configurez et activez les fournisseurs de suivi GPS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flespi */}
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.flespi.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <label className="font-medium text-gray-900">Flespi</label>
              </div>
              <input
                type="checkbox"
                checked={providers.flespi.enabled}
                onChange={() => handleProviderToggle('flespi')}
                className="h-4 w-4"
              />
            </div>
            {providers.flespi.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token API</label>
                  <Input
                    type="password"
                    placeholder="Entrer le token API Flespi"
                    value={providers.flespi.token}
                    onChange={(e) => handleProviderChange('flespi', 'token', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID du canal</label>
                  <Input
                    type="text"
                    placeholder="Entrer l'ID du canal"
                    value={providers.flespi.channelId}
                    onChange={(e) => handleProviderChange('flespi', 'channelId', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Echoes */}
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.echoes.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <label className="font-medium text-gray-900">Echoes</label>
              </div>
              <input
                type="checkbox"
                checked={providers.echoes.enabled}
                onChange={() => handleProviderToggle('echoes')}
                className="h-4 w-4"
              />
            </div>
            {providers.echoes.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL API</label>
                  <Input
                    type="text"
                    placeholder="https://api.echoes.com"
                    value={providers.echoes.url}
                    onChange={(e) => handleProviderChange('echoes', 'url', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clé de confidentialité</label>
                  <Input
                    type="password"
                    placeholder="Entrer la clé de confidentialité"
                    value={providers.echoes.privacyKey}
                    onChange={(e) => handleProviderChange('echoes', 'privacyKey', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* KeepTrace */}
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.keeptrace.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <label className="font-medium text-gray-900">KeepTrace</label>
              </div>
              <input
                type="checkbox"
                checked={providers.keeptrace.enabled}
                onChange={() => handleProviderToggle('keeptrace')}
                className="h-4 w-4"
              />
            </div>
            {providers.keeptrace.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
                <Input
                  type="password"
                  placeholder="Entrer la clé API KeepTrace"
                  value={providers.keeptrace.apiKey}
                  onChange={(e) => handleProviderChange('keeptrace', 'apiKey', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Ubiwan */}
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.ubiwan.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <label className="font-medium text-gray-900">Ubiwan</label>
              </div>
              <input
                type="checkbox"
                checked={providers.ubiwan.enabled}
                onChange={() => handleProviderToggle('ubiwan')}
                className="h-4 w-4"
              />
            </div>
            {providers.ubiwan.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL du point d'accès</label>
                  <Input
                    type="text"
                    placeholder="https://api.ubiwan.com"
                    value={providers.ubiwan.endpoint}
                    onChange={(e) => handleProviderChange('ubiwan', 'endpoint', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identifiants</label>
                  <Input
                    type="password"
                    placeholder="Entrer les identifiants"
                    value={providers.ubiwan.credentials}
                    onChange={(e) => handleProviderChange('ubiwan', 'credentials', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={20} />
            Clés API
          </CardTitle>
          <CardDescription>Gérez vos identifiants API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Votre clé API</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                disabled
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-3"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyApiKey}
                className="px-3"
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Gardez votre clé API en sécurité. Ne la partagez jamais.</p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={regenerateApiKey}
          >
            <RefreshCw size={16} className="mr-2" />
            Régénérer la clé API
          </Button>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Conservation des données
          </CardTitle>
          <CardDescription>Contrôlez la durée de conservation de l'historique GPS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Période de conservation de l'historique GPS</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="30">30 jours</option>
              <option value="60">60 jours</option>
              <option value="90">90 jours</option>
              <option value="180">180 jours</option>
              <option value="365">1 an</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Les données plus anciennes que la période sélectionnée seront automatiquement supprimées.
            </p>
          </div>
          <Button className="w-full">Enregistrer la politique de conservation</Button>
        </CardContent>
      </Card>

      {/* Map Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Paramètres de carte
          </CardTitle>
          <CardDescription>Configurez les paramètres de carte par défaut</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude du centre</label>
              <Input
                type="text"
                value={mapDefaults.centerLat}
                onChange={(e) => handleMapDefaultChange('centerLat', e.target.value)}
                placeholder="43.7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude du centre</label>
              <Input
                type="text"
                value={mapDefaults.centerLng}
                onChange={(e) => handleMapDefaultChange('centerLng', e.target.value)}
                placeholder="7.12"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau de zoom par défaut</label>
            <Input
              type="text"
              value={mapDefaults.zoom}
              onChange={(e) => handleMapDefaultChange('zoom', e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couche de tuiles</label>
            <select
              value={mapDefaults.tileLayer}
              onChange={(e) => handleMapDefaultChange('tileLayer', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="streets">Mapbox Plan (streets-v12)</option>
              <option value="satellite">Mapbox Satellite (satellite-streets-v12)</option>
              <option value="terrain">Mapbox Terrain (outdoors-v12)</option>
              <option value="dark">Mapbox Sombre (dark-v11)</option>
            </select>
          </div>
          <Button className="w-full">Enregistrer les paramètres de carte</Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">La suppression de votre compte est irréversible. Soyez certain de votre choix.</p>
          <Button variant="destructive" className="w-full">
            Supprimer le compte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
