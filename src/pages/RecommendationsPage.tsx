import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Zap,
  MapPin,
  Wrench,
  Leaf,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  AlertCircle,
  Check,
  Clock,
} from 'lucide-react'

type RecommendationCategory =
  | 'economie_carburant'
  | 'optimisation_routes'
  | 'maintenance'
  | 'conduite_eco'
  | 'renouvellement'

type PriorityLevel = 'haute' | 'moyenne' | 'basse'
type RecommendationStatus = 'nouveau' | 'en_cours' | 'applique' | 'ignore'

interface Recommendation {
  id: string
  title: string
  description: string
  category: RecommendationCategory
  priority: PriorityLevel
  status: RecommendationStatus
  impact: string
  impactValue: number
  impactUnit: 'euro' | 'percent'
  createdAt: string
  appliedDate?: string
  details: string[]
  affectedVehicles: number
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec_001',
    title: 'Optimiser les trajets quotidiens',
    description:
      'Réorganiser les itinéraires pour réduire les distances de 15-20%',
    category: 'optimisation_routes',
    priority: 'haute',
    status: 'nouveau',
    impact: '2400',
    impactValue: 2400,
    impactUnit: 'euro',
    createdAt: '2026-05-02',
    details: [
      'Analyse des trajets répétitifs identifiée',
      'Potentiel de regroupement: 35 arrêts',
      'Réduction estimée: 450km/mois',
      'Économie carburant: 180€/mois',
    ],
    affectedVehicles: 8,
  },
  {
    id: 'rec_002',
    title: 'Passer au carburant XL',
    description: 'Utiliser le programme carburant économique pour tous les véhicules',
    category: 'economie_carburant',
    priority: 'haute',
    status: 'en_cours',
    impact: '1800',
    impactValue: 1800,
    impactUnit: 'euro',
    createdAt: '2026-04-28',
    appliedDate: '2026-05-01',
    details: [
      'Cartes adhésion à 45 stations',
      'Prix réduit: -0.12€/litre en moyenne',
      'Retrocompatibilité: 100%',
      'Réduction estimée: 150€/mois',
    ],
    affectedVehicles: 22,
  },
  {
    id: 'rec_003',
    title: 'Formation conduite écologique',
    description:
      'Programme de formation pour les chauffeurs sur la conduite éco-responsable',
    category: 'conduite_eco',
    priority: 'haute',
    status: 'applique',
    impact: '12',
    impactValue: 12,
    impactUnit: 'percent',
    createdAt: '2026-04-15',
    appliedDate: '2026-04-25',
    details: [
      'Formation: 2 jours en intra-entreprise',
      'Réduction consommation: 8-15%',
      'ROI: 3 mois',
      'Coût: 1200€ (5 jours)',
    ],
    affectedVehicles: 12,
  },
  {
    id: 'rec_004',
    title: 'Maintenance préventive Renault Master',
    description: 'Intervalle de révision réduit pour 2 véhicules avec usure anormale',
    category: 'maintenance',
    priority: 'moyenne',
    status: 'nouveau',
    impact: '850',
    impactValue: 850,
    impactUnit: 'euro',
    createdAt: '2026-05-03',
    details: [
      'Détection: filtres à air encrassés',
      'Impact actuel: +2.5 L/100km',
      'Coût maintenance: 180€',
      'Économie annuelle: 850€',
    ],
    affectedVehicles: 2,
  },
  {
    id: 'rec_005',
    title: 'Réduire la pression des pneus',
    description: 'Optimisation pression pour améliorer l\'efficacité énergétique',
    category: 'economie_carburant',
    priority: 'basse',
    status: 'nouveau',
    impact: '6',
    impactValue: 6,
    impactUnit: 'percent',
    createdAt: '2026-05-04',
    details: [
      'Vérification mensuelle recommandée',
      'Réduction: -0.3 bar de pression',
      'Gain consommation: 5-8%',
      'Économie: 40€/mois/véhicule',
    ],
    affectedVehicles: 15,
  },
  {
    id: 'rec_006',
    title: 'Mise à jour logicielle moteur',
    description: 'Optimisation du système de gestion moteur pour économies carburant',
    category: 'maintenance',
    priority: 'moyenne',
    status: 'nouveau',
    impact: '720',
    impactValue: 720,
    impactUnit: 'euro',
    createdAt: '2026-05-01',
    details: [
      'Compatibilité: Ford Transit (5 véhicules)',
      'Durée: 30 minutes par véhicule',
      'Coût gratuit (sous garantie)',
      'Réduction: 4-6%',
    ],
    affectedVehicles: 5,
  },
  {
    id: 'rec_007',
    title: 'Remplacer Mercedes 180',
    description: 'Renouvellement du véhicule en fin de vie pour modèle plus efficace',
    category: 'renouvellement',
    priority: 'haute',
    status: 'nouveau',
    impact: '3200',
    impactValue: 3200,
    impactUnit: 'euro',
    createdAt: '2026-04-20',
    details: [
      'Âge: 8 ans, 285000 km',
      'Consommation actuelle: 14.2 L/100km',
      'Modèle recommandé: Mercedes eActros',
      'Économie annuelle estimée: 3200€',
    ],
    affectedVehicles: 1,
  },
  {
    id: 'rec_008',
    title: 'Géolocalisation avancée',
    description: 'Activation des alertes vitesse et détection des trajets inefficaces',
    category: 'optimisation_routes',
    priority: 'basse',
    status: 'applique',
    impact: '15',
    impactValue: 15,
    impactUnit: 'percent',
    createdAt: '2026-04-10',
    appliedDate: '2026-04-22',
    details: [
      'Configuration GPS: réglage temps réel',
      'Alertes: dépassement vitesse',
      'Rapports: trajets alternatifs',
      'Réduction consommation: 10-20%',
    ],
    affectedVehicles: 20,
  },
  {
    id: 'rec_009',
    title: 'Audit pneumatique complet',
    description: 'Vérification de l\'usure et alignement pour toute la flotte',
    category: 'maintenance',
    priority: 'moyenne',
    status: 'en_cours',
    impact: '450',
    impactValue: 450,
    impactUnit: 'euro',
    createdAt: '2026-04-25',
    appliedDate: '2026-05-02',
    details: [
      'Audit: 18 véhicules prévus',
      'Coût audit: 540€ total',
      'ROI estimé: 2 mois',
      'Économies: usure réduite de 20%',
    ],
    affectedVehicles: 18,
  },
  {
    id: 'rec_010',
    title: 'Conduite autonome et covoiturage',
    description: 'Partage de trajets et optimisation intelligente des déplacements',
    category: 'optimisation_routes',
    priority: 'basse',
    status: 'nouveau',
    impact: '2800',
    impactValue: 2800,
    impactUnit: 'euro',
    createdAt: '2026-04-18',
    details: [
      'Plateforme de covoiturage',
      'Intégration calendrier: 60%',
      'Trajets mutualisés: 35-40%',
      'Économie: 230€/mois potentielle',
    ],
    affectedVehicles: 12,
  },
  {
    id: 'rec_011',
    title: 'Entretien climatisation',
    description: 'Service de climatisation pour améliorer l\'efficacité aérodynamique',
    category: 'maintenance',
    priority: 'basse',
    status: 'ignore',
    impact: '120',
    impactValue: 120,
    impactUnit: 'euro',
    createdAt: '2026-04-12',
    details: [
      'Recharge R134a tous les 2 ans',
      'Coût service: 85€/véhicule',
      'Économie: 10€/mois/véhicule',
      'Amélioration confort: 30%',
    ],
    affectedVehicles: 8,
  },
  {
    id: 'rec_012',
    title: 'Carburant additif haute performance',
    description: 'Utiliser un carburant avec additifs pour meilleure combustion',
    category: 'economie_carburant',
    priority: 'basse',
    status: 'nouveau',
    impact: '3',
    impactValue: 3,
    impactUnit: 'percent',
    createdAt: '2026-05-05',
    details: [
      'Surcoût: +0.05€/litre',
      'Réduction consommation: 2-4%',
      'Amélioration moteur: 15%',
      'ROI: 6 mois',
    ],
    affectedVehicles: 22,
  },
  {
    id: 'rec_013',
    title: 'Télématique pour micro-gestion',
    description: 'Système de suivi détaillé des comportements de conduite',
    category: 'conduite_eco',
    priority: 'moyenne',
    status: 'nouveau',
    impact: '8',
    impactValue: 8,
    impactUnit: 'percent',
    createdAt: '2026-04-30',
    details: [
      'Capteurs: accélération, freinage',
      'Alertes temps réel',
      'Score conducteur par trajet',
      'Réduction: 5-12%',
    ],
    affectedVehicles: 22,
  },
  {
    id: 'rec_014',
    title: 'Batterie auxiliaire hybride légère',
    description: 'Installation batterie pour récupération énergie au freinage',
    category: 'renouvellement',
    priority: 'moyenne',
    status: 'nouveau',
    impact: '2100',
    impactValue: 2100,
    impactUnit: 'euro',
    createdAt: '2026-04-08',
    details: [
      'Installation: 6 véhicules candidates',
      'Coût par unité: 4500€',
      'Économie: 175€/mois par véhicule',
      'ROI: 26 mois',
    ],
    affectedVehicles: 6,
  },
  {
    id: 'rec_015',
    title: 'Planification maintenance prédictive',
    description: 'Système IA pour prédire pannes avant qu\'elles se produisent',
    category: 'maintenance',
    priority: 'haute',
    status: 'nouveau',
    impact: '1650',
    impactValue: 1650,
    impactUnit: 'euro',
    createdAt: '2026-04-05',
    details: [
      'Analyse: historique réparation',
      'Prédiction: défaillance moteur',
      'Prévention: 5-8 pannes/an',
      'Économie d\'immobilisation: 1650€',
    ],
    affectedVehicles: 22,
  },
  {
    id: 'rec_016',
    title: 'Renouvellement Peugeot Boxer',
    description: 'Remplacer véhicule hors-norme par modèle électrique',
    category: 'renouvellement',
    priority: 'moyenne',
    status: 'nouveau',
    impact: '4500',
    impactValue: 4500,
    impactUnit: 'euro',
    createdAt: '2026-04-03',
    details: [
      'Modèle actuel: Peugeot Boxer 2015',
      'Consommation: 16.5 L/100km',
      'Remplacement: Peugeot e-Boxer',
      'Économie annuelle: 4500€',
    ],
    affectedVehicles: 1,
  },
]

const CATEGORY_ICONS: Record<RecommendationCategory, React.ReactNode> = {
  economie_carburant: <Zap className="h-5 w-5" />,
  optimisation_routes: <MapPin className="h-5 w-5" />,
  maintenance: <Wrench className="h-5 w-5" />,
  conduite_eco: <Leaf className="h-5 w-5" />,
  renouvellement: <RefreshCw className="h-5 w-5" />,
}

const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  economie_carburant: 'Économies carburant',
  optimisation_routes: 'Optimisation routes',
  maintenance: 'Maintenance préventive',
  conduite_eco: 'Conduite éco',
  renouvellement: 'Renouvellement flotte',
}

const CATEGORY_COLORS: Record<RecommendationCategory, string> = {
  economie_carburant: 'text-amber-600',
  optimisation_routes: 'text-blue-600',
  maintenance: 'text-orange-600',
  conduite_eco: 'text-green-600',
  renouvellement: 'text-purple-600',
}

const STATUS_LABELS: Record<RecommendationStatus, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  applique: 'Appliqué',
  ignore: 'Ignoré',
}

const STATUS_COLORS: Record<RecommendationStatus, string> = {
  nouveau: 'bg-blue-50 text-blue-700 border-blue-200',
  en_cours: 'bg-amber-50 text-amber-700 border-amber-200',
  applique: 'bg-green-50 text-green-700 border-green-200',
  ignore: 'bg-gray-50 text-gray-700 border-gray-200',
}

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  haute: 'bg-red-100 text-red-700',
  moyenne: 'bg-orange-100 text-orange-700',
  basse: 'bg-blue-100 text-blue-700',
}

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  haute: 'Haute',
  moyenne: 'Moyenne',
  basse: 'Basse',
}

export default function RecommendationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<RecommendationCategory | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<RecommendationStatus | 'all'>('all')
  const [actionDialogs, setActionDialogs] = useState<Record<string, string>>({})

  const filteredRecommendations = MOCK_RECOMMENDATIONS.filter((rec) => {
    if (filterCategory !== 'all' && rec.category !== filterCategory) return false
    if (filterPriority !== 'all' && rec.priority !== filterPriority) return false
    if (filterStatus !== 'all' && rec.status !== filterStatus) return false
    return true
  })

  // KPI calculations
  const totalPotentialSavings = MOCK_RECOMMENDATIONS.filter(
    (r) => r.impactUnit === 'euro'
  ).reduce((sum, r) => sum + r.impactValue, 0)

  const activeRecommendations = MOCK_RECOMMENDATIONS.filter(
    (r) => r.status === 'nouveau' || r.status === 'en_cours'
  ).length

  const appliedThisMonth = MOCK_RECOMMENDATIONS.filter(
    (r) => r.status === 'applique' && new Date(r.appliedDate || '') >= new Date('2026-05-01')
  ).length

  const estimatedROI = (appliedThisMonth * 350) / (appliedThisMonth * 500) // Simplified
  const estimatedROIPercent = Math.round(estimatedROI * 100)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleAction = (id: string, action: string) => {
    setActionDialogs({ ...actionDialogs, [id]: action })
  }

  const confirmAction = (id: string) => {
    // In a real app, this would update the backend
    console.log(`Action confirmed for recommendation ${id}: ${actionDialogs[id]}`)
    setActionDialogs({ ...actionDialogs, [id]: '' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          Recommandations optimisation flotte
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Économies potentielles
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {(totalPotentialSavings / 1000).toFixed(1)}k€
                </p>
                <p className="text-xs text-gray-500 mt-1">Total annuel estimé</p>
              </div>
              <Zap className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Recommandations actives
                </p>
                <p className="text-2xl font-bold text-blue-600">{activeRecommendations}</p>
                <p className="text-xs text-gray-500 mt-1">À traiter ou en cours</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Appliquées ce mois
                </p>
                <p className="text-2xl font-bold text-purple-600">{appliedThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Depuis le 1er mai</p>
              </div>
              <Check className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  ROI estimé
                </p>
                <p className="text-2xl font-bold text-amber-600">{estimatedROIPercent}%</p>
                <p className="text-xs text-gray-500 mt-1">Sur 12 mois</p>
              </div>
              <TrendingDown className="h-8 w-8 text-amber-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                value={filterCategory}
                onChange={(e) =>
                  setFilterCategory(e.target.value as RecommendationCategory | 'all')
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les catégories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priorité</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as PriorityLevel | 'all')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les priorités</option>
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as RecommendationStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="applique">Appliqué</option>
                <option value="ignore">Ignoré</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filteredRecommendations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Aucune recommandation ne correspond à vos critères</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <button
                    onClick={() => toggleExpand(rec.id)}
                    className="w-full flex items-start justify-between gap-4 hover:opacity-75 transition-opacity"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`mt-1 ${CATEGORY_COLORS[rec.category]}`}
                      >
                        {CATEGORY_ICONS[rec.category]}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-sm">{rec.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                    </div>
                    {expandedId === rec.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[rec.priority]}`}
                      >
                        {PRIORITY_LABELS[rec.priority]}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[rec.status]}`}
                      >
                        {STATUS_LABELS[rec.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {rec.impactUnit === 'euro'
                            ? `${rec.impactValue}€`
                            : `${rec.impactValue}%`}{' '}
                          /mois
                        </p>
                        <p className="text-xs text-gray-500">
                          {rec.affectedVehicles} véhicule{rec.affectedVehicles > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === rec.id && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Analyse détaillée
                        </h4>
                        <ul className="space-y-2">
                          {rec.details.map((detail, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {rec.status === 'nouveau' && (
                          <>
                            <button
                              onClick={() => handleAction(rec.id, 'apply')}
                              className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Appliquer
                            </button>
                            <button
                              onClick={() => handleAction(rec.id, 'schedule')}
                              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Planifier
                            </button>
                            <button
                              onClick={() => handleAction(rec.id, 'ignore')}
                              className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                            >
                              Ignorer
                            </button>
                          </>
                        )}

                        {rec.status === 'en_cours' && (
                          <div className="w-full flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                            <Clock className="h-4 w-4" />
                            <span>Action en cours...</span>
                          </div>
                        )}

                        {rec.status === 'applique' && (
                          <div className="w-full flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                            <Check className="h-4 w-4" />
                            <span>
                              Appliquée le {new Date(rec.appliedDate || '').toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}

                        {rec.status === 'ignore' && (
                          <div className="w-full text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                            Recommandation ignorée
                          </div>
                        )}
                      </div>

                      {/* Action Confirmation */}
                      {actionDialogs[rec.id] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                          <p className="text-sm text-blue-900">
                            Confirmer l'action "{actionDialogs[rec.id]}" pour cette recommandation?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmAction(rec.id)}
                              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setActionDialogs({ ...actionDialogs, [rec.id]: '' })}
                              className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
