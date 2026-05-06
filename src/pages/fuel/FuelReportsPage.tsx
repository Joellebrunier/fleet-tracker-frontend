import { useState } from 'react'
import { BarChart3, TrendingUp, Users, AlertCircle, Leaf, DollarSign, Download, FileText, Calendar } from 'lucide-react'

interface Report {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  lastGenerated?: string
}

interface GeneratedReport {
  id: string
  type: string
  date: string
  format: 'PDF' | 'Excel' | 'CSV'
  size: number
}

const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    title: 'Consommation mensuelle',
    description: 'Analyse détaillée de la consommation de carburant par mois',
    icon: <BarChart3 className="h-6 w-6" />,
    lastGenerated: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Coûts par véhicule',
    description: 'Répartition des coûts de carburant par véhicule',
    icon: <DollarSign className="h-6 w-6" />,
    lastGenerated: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '3',
    title: 'Analyse conducteurs',
    description: 'Score écologique et performances par conducteur',
    icon: <Users className="h-6 w-6" />,
    lastGenerated: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: '4',
    title: 'Anomalies détectées',
    description: 'Signalement automatique des anomalies de consommation',
    icon: <AlertCircle className="h-6 w-6" />,
    lastGenerated: undefined,
  },
  {
    id: '5',
    title: 'CSRD / Émissions',
    description: 'Bilan carbone et conformité réglementaire',
    icon: <Leaf className="h-6 w-6" />,
    lastGenerated: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '6',
    title: 'Budget vs Réel',
    description: 'Comparaison du budget prévu avec les dépenses réelles',
    icon: <TrendingUp className="h-6 w-6" />,
    lastGenerated: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

const MOCK_GENERATED_REPORTS: GeneratedReport[] = [
  {
    id: '1',
    type: 'Consommation mensuelle - Mai 2026',
    date: new Date(Date.now() - 86400000).toISOString(),
    format: 'PDF',
    size: 2.4,
  },
  {
    id: '2',
    type: 'Coûts par véhicule - Mai 2026',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    format: 'Excel',
    size: 1.8,
  },
  {
    id: '3',
    type: 'Analyse conducteurs - Avril 2026',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    format: 'PDF',
    size: 3.1,
  },
  {
    id: '4',
    type: 'Budget vs Réel - T1 2026',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    format: 'Excel',
    size: 0.9,
  },
  {
    id: '5',
    type: 'CSRD / Émissions - Q1 2026',
    date: new Date(Date.now() - 86400000 * 8).toISOString(),
    format: 'PDF',
    size: 4.2,
  },
]

export default function FuelReportsPage() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF')
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  const handleGenerateReport = (reportId: string) => {
    setGeneratingReport(reportId)
    setTimeout(() => setGeneratingReport(null), 1500)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Rapports de consommation carburant</h2>
        <p className="text-sm text-gray-500 mt-1">Générez des rapports détaillés sur la consommation et les coûts</p>
      </div>

      {/* Date and format selectors */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format d'export</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'Excel' | 'CSV')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-gray-500 mb-2 block">Période sélectionnée</p>
            <p className="font-medium text-gray-900">{Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)} jours</p>
          </div>
        </div>
      </div>

      {/* Report types grid */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Types de rapports disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_REPORTS.map((report) => (
            <div key={report.id} className="rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  {report.icon}
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{report.title}</h4>
              <p className="text-sm text-gray-500 mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={generatingReport === report.id}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {generatingReport === report.id ? 'Génération...' : 'Générer'}
                </button>
                {report.lastGenerated && (
                  <p className="text-xs text-gray-500">
                    {new Date(report.lastGenerated).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated reports history */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Historique des rapports générés</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Type de rapport</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date de génération</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Format</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Taille</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_GENERATED_REPORTS.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{report.type}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(report.date).toLocaleDateString('fr-FR')} à {new Date(report.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {report.size} MB
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
