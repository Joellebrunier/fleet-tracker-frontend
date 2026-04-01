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
    centerLat: '48.8566',
    centerLng: '2.3522',
    zoom: '12',
    tileLayer: 'openstreetmap',
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
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your profile and preferences</p>
      </div>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Profile
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <Input
              type="text"
              value={user?.firstName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
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
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <Input type="text" value={user?.role || ''} disabled className="mt-1" />
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full"
            variant={isEditing ? 'default' : 'outline'}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} />
            Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
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
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Speed Unit</label>
            <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <option value="kmh">Kilometers per hour (km/h)</option>
              <option value="mph">Miles per hour (mph)</option>
              <option value="kn">Knots (kn)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Distance Unit</label>
            <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <option value="km">Kilometers (km)</option>
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
          <CardDescription>Control how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Email Notifications', key: 'email' },
            { label: 'Push Notifications', key: 'push' },
            { label: 'SMS Notifications', key: 'sms' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{item.label}</label>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
          ))}
          <Button className="w-full mt-4">Save Preferences</Button>
        </CardContent>
      </Card>

      {/* GPS Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi size={20} />
            GPS Providers
          </CardTitle>
          <CardDescription>Configure and enable GPS tracking providers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flespi */}
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="font-medium text-gray-900">Flespi</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                  <Input
                    type="password"
                    placeholder="Enter Flespi API token"
                    value={providers.flespi.token}
                    onChange={(e) => handleProviderChange('flespi', 'token', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel ID</label>
                  <Input
                    type="text"
                    placeholder="Enter Channel ID"
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
              <label className="font-medium text-gray-900">Echoes</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                  <Input
                    type="text"
                    placeholder="https://api.echoes.com"
                    value={providers.echoes.url}
                    onChange={(e) => handleProviderChange('echoes', 'url', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Key</label>
                  <Input
                    type="password"
                    placeholder="Enter Privacy Key"
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
              <label className="font-medium text-gray-900">KeepTrace</label>
              <input
                type="checkbox"
                checked={providers.keeptrace.enabled}
                onChange={() => handleProviderToggle('keeptrace')}
                className="h-4 w-4"
              />
            </div>
            {providers.keeptrace.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <Input
                  type="password"
                  placeholder="Enter KeepTrace API Key"
                  value={providers.keeptrace.apiKey}
                  onChange={(e) => handleProviderChange('keeptrace', 'apiKey', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Ubiwan */}
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="font-medium text-gray-900">Ubiwan</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                  <Input
                    type="text"
                    placeholder="https://api.ubiwan.com"
                    value={providers.ubiwan.endpoint}
                    onChange={(e) => handleProviderChange('ubiwan', 'endpoint', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
                  <Input
                    type="password"
                    placeholder="Enter credentials"
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
            API Keys
          </CardTitle>
          <CardDescription>Manage your API credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key</label>
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
            <p className="text-xs text-gray-500 mt-2">Keep your API key secure. Never share it with others.</p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={regenerateApiKey}
          >
            <RefreshCw size={16} className="mr-2" />
            Regenerate API Key
          </Button>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Data Retention
          </CardTitle>
          <CardDescription>Control how long GPS history is stored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">GPS History Retention Period</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Data older than the selected period will be automatically deleted to save storage space.
            </p>
          </div>
          <Button className="w-full">Save Retention Policy</Button>
        </CardContent>
      </Card>

      {/* Map Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Map Defaults
          </CardTitle>
          <CardDescription>Configure default map settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Center Latitude</label>
              <Input
                type="text"
                value={mapDefaults.centerLat}
                onChange={(e) => handleMapDefaultChange('centerLat', e.target.value)}
                placeholder="48.8566"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Center Longitude</label>
              <Input
                type="text"
                value={mapDefaults.centerLng}
                onChange={(e) => handleMapDefaultChange('centerLng', e.target.value)}
                placeholder="2.3522"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Zoom Level</label>
            <Input
              type="text"
              value={mapDefaults.zoom}
              onChange={(e) => handleMapDefaultChange('zoom', e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tile Layer</label>
            <select
              value={mapDefaults.tileLayer}
              onChange={(e) => handleMapDefaultChange('tileLayer', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="openstreetmap">OpenStreetMap</option>
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
          <Button className="w-full">Save Map Settings</Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Once you delete your account, there is no going back. Please be certain.</p>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
