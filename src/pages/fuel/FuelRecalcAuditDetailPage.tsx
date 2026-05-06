import { useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Clock } from 'lucide-react'

interface TimelineEvent {
  timestamp: string
  user: string
  action: string
  details: string
}

interface AffectedTransaction {
  id: string
  date: string
  station: string
  liters: number
  oldTotal: number
  newTotal: number
}

interface Comment {
  id: string
  user: string
  timestamp: string
  text: string
  role: 'auditor' | 'reviewer'
}

const MOCK_AUDIT_DETAIL = {
  id: 'AUD-001',
  vehicle: 'Renault Master',
  licensePlate: 'AB-123-CD',
  period: 'Mai 2026',
  oldConsumption: 12.5,
  newConsumption: 12.8,
  difference: 0.3,
  percentChange: 2.4,
  reason: 'Correction données capteur',
  status: 'validé',
  createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  createdBy: 'Alice Dupont',
}

const MOCK_TIMELINE: TimelineEvent[] = [
  {
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    user: 'Alice Dupont',
    action: 'Création du recalcul',
    details: 'Initialisé par correction manuelle suite à détection d\'anomalie',
  },
  {
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    user: 'Système',
    action: 'Validation initiale',
    details: 'Vérification des données source complétée avec succès',
  },
  {
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: 'Marc Leclerc',
    action: 'Approbation',
    details: 'Examen et validation des modifications',
  },
]

const MOCK_AFFECTED_TRANSACTIONS: AffectedTransaction[] = [
  {
    id: 'TXN-001',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    station: 'Total Nice Arenas',
    liters: 65,
    oldTotal: 107.185,
    newTotal: 107.62,
  },
  {
    id: 'TXN-002',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    station: 'Shell Cannes',
    liters: 55,
    oldTotal: 91.248,
    newTotal: 91.695,
  },
  {
    id: 'TXN-003',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    station: 'BP Antibes',
    liters: 68,
    oldTotal: 114.784,
    newTotal: 115.292,
  },
]

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    user: 'Alice Dupont',
    timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    text: 'Les lectures du capteur montrent une anomalie. Le capteur de température semble mal calibré.',
    role: 'auditor',
  },
  {
    id: '2',
    user: 'Marc Leclerc',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    text: 'Confirmé après inspection. Les données corrigées sont maintenant cohérentes avec les lectures physiques.',
    role: 'reviewer',
  },
]

export default function FuelRecalcAuditDetailPage() {
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [newComment, setNewComment] = useState('')

  return (
    <div className="p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div>
          <p className="text-sm text-gray-500">Détail du recalcul</p>
          <h1 className="text-2xl font-bold text-gray-900">{MOCK_AUDIT_DETAIL.id}</h1>
        </div>
      </div>

      {/* Main info card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Véhicule</p>
            <p className="text-xl font-bold text-gray-900">{MOCK_AUDIT_DETAIL.vehicle}</p>
            <p className="text-sm text-gray-600 mt-1">{MOCK_AUDIT_DETAIL.licensePlate}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                Validé
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Période</p>
            <p className="font-semibold text-gray-900">{MOCK_AUDIT_DETAIL.period}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Ancien L/100km</p>
            <p className="font-semibold text-gray-900">{MOCK_AUDIT_DETAIL.oldConsumption}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Nouveau L/100km</p>
            <p className="font-semibold text-gray-900">{MOCK_AUDIT_DETAIL.newConsumption}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Variation</p>
            <p className="font-semibold text-red-600">+{MOCK_AUDIT_DETAIL.percentChange}%</p>
          </div>
        </div>
      </div>

      {/* Before/After comparison */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Comparaison avant / après</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Avant recalcul</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consommation moyenne</span>
                <span className="font-bold text-gray-900">{MOCK_AUDIT_DETAIL.oldConsumption} L/100km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transactions affectées</span>
                <span className="font-bold text-gray-900">{MOCK_AFFECTED_TRANSACTIONS.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Coût estimé</span>
                <span className="font-bold text-gray-900">1 224 €</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 border-2 border-green-200">
            <p className="text-sm font-semibold text-green-700 mb-3">Après recalcul</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consommation moyenne</span>
                <span className="font-bold text-gray-900">{MOCK_AUDIT_DETAIL.newConsumption} L/100km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transactions affectées</span>
                <span className="font-bold text-gray-900">{MOCK_AFFECTED_TRANSACTIONS.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Coût estimé</span>
                <span className="font-bold text-gray-900">1 254 €</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Chronologie
        </h3>
        <div className="space-y-4">
          {MOCK_TIMELINE.map((event, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                {i < MOCK_TIMELINE.length - 1 && <div className="w-0.5 h-12 bg-gray-300 mt-2" />}
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold text-gray-900">{event.action}</p>
                <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString('fr-FR')}</p>
                <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                <p className="text-xs text-gray-500 mt-1">Par: {event.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affected transactions */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Transactions affectées</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">ID Transaction</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Station</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Litres</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Ancien total</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Nouveau total</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Différence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_AFFECTED_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{tx.id}</td>
                  <td className="px-6 py-3 text-gray-900">{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-3 text-gray-900">{tx.station}</td>
                  <td className="px-6 py-3 text-right font-medium">{tx.liters} L</td>
                  <td className="px-6 py-3 text-right text-gray-500">{tx.oldTotal.toFixed(2)} €</td>
                  <td className="px-6 py-3 text-right text-gray-500">{tx.newTotal.toFixed(2)} €</td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600">+{(tx.newTotal - tx.oldTotal).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires ({MOCK_COMMENTS.length})
        </h3>
        <div className="space-y-4 mb-6">
          {MOCK_COMMENTS.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{comment.user}</p>
                  <p className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleDateString('fr-FR')} à {new Date(comment.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${comment.role === 'auditor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {comment.role === 'auditor' ? 'Auditeur' : 'Examinateur'}
                </span>
              </div>
              <p className="text-gray-700">{comment.text}</p>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ajouter un commentaire</label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Votre commentaire..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <button className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition">
            Publier le commentaire
          </button>
        </div>
      </div>

      {/* Approval section */}
      {MOCK_AUDIT_DETAIL.status === 'validé' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900">Recalcul approuvé</h3>
              <p className="text-sm text-green-800 mt-1">Approuvé par Marc Leclerc le {new Date(MOCK_AUDIT_DETAIL.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
