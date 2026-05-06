import { useState, useEffect } from 'react'
import { Play, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react'

interface Recalculation {
  id: string
  vehicle: string
  licensePlate: string
  period: string
  method: string
  progress: number
  status: 'en_cours' | 'terminé' | 'erreur'
  duration: number
}

const MOCK_RECALCULATIONS: Recalculation[] = [
  { id: '1', vehicle: 'Renault Master', licensePlate: 'AB-123-CD', period: 'Mai 2026', method: 'Moyenne mobile', progress: 85, status: 'en_cours', duration: 1243 },
  { id: '2', vehicle: 'Peugeot Expert', licensePlate: 'EF-456-GH', period: 'Avril 2026', method: 'Lissage exponentiel', progress: 100, status: 'terminé', duration: 892 },
  { id: '3', vehicle: 'Citroën Jumpy', licensePlate: 'IJ-789-KL', period: 'Mars 2026', method: 'Régression', progress: 100, status: 'terminé', duration: 1105 },
  { id: '4', vehicle: 'Renault Clio', licensePlate: 'HJ-180-PW', period: 'Mai 2026', method: 'Moyenne mobile', progress: 35, status: 'en_cours', duration: 523 },
  { id: '5', vehicle: 'Dacia Duster', licensePlate: 'MN-012-OP', period: 'Février 2026', method: 'Spline', progress: 0, status: 'erreur', duration: 0 },
]

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'en_cours':
      return 'text-blue-600'
    case 'terminé':
      return 'text-green-600'
    case 'erreur':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'en_cours':
      return 'En cours'
    case 'terminé':
      return 'Terminée'
    case 'erreur':
      return 'Erreur'
    default:
      return 'Inconnu'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'en_cours':
      return <RefreshCw className="h-4 w-4 animate-spin" />
    case 'terminé':
      return <CheckCircle2 className="h-4 w-4" />
    case 'erreur':
      return <AlertCircle className="h-4 w-4" />
    default:
      return null
  }
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export default function FuelRecalcStatusPage() {
  const [recalcs, setRecalcs] = useState<Recalculation[]>(MOCK_RECALCULATIONS)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setRecalcs((prev) =>
        prev.map((r) => {
          if (r.status === 'en_cours') {
            const newProgress = Math.min(r.progress + Math.random() * 20, 100)
            return {
              ...r,
              progress: newProgress,
              duration: r.duration + 10,
              status: newProgress >= 100 ? 'terminé' : 'en_cours',
            }
          }
          return r
        })
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const stats = {
    enCours: recalcs.filter((r) => r.status === 'en_cours').length,
    terminees: recalcs.filter((r) => r.status === 'terminé').length,
    erreurs: recalcs.filter((r) => r.status === 'erreur').length,
    tempsMoyen: Math.round(recalcs.filter((r) => r.status === 'terminé').reduce((sum, r) => sum + r.duration, 0) / Math.max(recalcs.filter((r) => r.status === 'terminé').length, 1)),
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header and refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">État des recalculs</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              autoRefresh
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {autoRefresh ? '✓ Actualisation auto' : 'Actualisation manuelle'}
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition">
            <Play className="h-4 w-4 inline mr-2" />
            Nouvelle recalculation
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <RefreshCw className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{stats.enCours}</p>
          <p className="text-xs text-gray-500">En cours</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{stats.terminees}</p>
          <p className="text-xs text-gray-500">Terminées aujourd'hui</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{stats.erreurs}</p>
          <p className="text-xs text-gray-500">Erreurs</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <Clock className="h-5 w-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{formatDuration(stats.tempsMoyen)}</p>
          <p className="text-xs text-gray-500">Temps moyen</p>
        </div>
      </div>

      {/* Active recalculations table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Recalculations actives</h3>
            {autoRefresh && <span className="ml-auto text-xs text-green-600 font-medium">Mise à jour automatique</span>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Véhicule</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Période</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Méthode</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Progression</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recalcs.map((recalc) => (
                <tr key={recalc.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{recalc.id}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{recalc.vehicle}</p>
                      <p className="text-xs text-gray-500">{recalc.licensePlate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{recalc.period}</td>
                  <td className="px-6 py-4 text-gray-900">{recalc.method}</td>
                  <td className="px-6 py-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{Math.round(recalc.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-600 transition-all"
                          style={{ width: `${recalc.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 font-medium ${getStatusColor(recalc.status)}`}>
                      {getStatusIcon(recalc.status)}
                      {getStatusLabel(recalc.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">{formatDuration(recalc.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Note:</span> Les recalculations se mettent à jour automatiquement toutes les 2 secondes. Chaque recalcul peut prendre plusieurs minutes selon la période couverte et la complexité des données.
        </p>
      </div>
    </div>
  )
}
