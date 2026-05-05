import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  Car,
  Search,
  Eye,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SharedLink {
  id: string
  token: string
  vehicleId: string
  vehicleName: string
  vehiclePlate: string
  recipientName: string
  recipientEmail?: string
  validUntil: string
  historyDays: number
  isActive: boolean
  viewCount: number
  lastViewedAt?: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_LINKS: SharedLink[] = [
  {
    id: '1',
    token: 'abc123def456',
    vehicleId: 'v1',
    vehicleName: 'Renault Clio',
    vehiclePlate: 'HJ-180-PW',
    recipientName: 'Client Martin',
    recipientEmail: 'martin@example.com',
    validUntil: new Date(Date.now() + 86400000 * 7).toISOString(),
    historyDays: 7,
    isActive: true,
    viewCount: 12,
    lastViewedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: '2',
    token: 'xyz789ghi012',
    vehicleId: 'v2',
    vehicleName: 'Peugeot 308',
    vehiclePlate: 'FP-456-AB',
    recipientName: 'Garage Dupont',
    validUntil: new Date(Date.now() + 86400000 * 2).toISOString(),
    historyDays: 3,
    isActive: true,
    viewCount: 5,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    token: 'mno345pqr678',
    vehicleId: 'v3',
    vehicleName: 'Citroën C3',
    vehiclePlate: 'GR-789-CD',
    recipientName: 'Assurance Maaf',
    validUntil: new Date(Date.now() - 86400000).toISOString(),
    historyDays: 14,
    isActive: false,
    viewCount: 28,
    lastViewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SharedLinksPage() {
  const { user } = useAuthStore()
  const [links, setLinks] = useState<SharedLink[]>(MOCK_LINKS)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'expired'>('all')

  // New link form
  const [newLink, setNewLink] = useState({
    vehicleName: '',
    recipientName: '',
    recipientEmail: '',
    validDays: 7,
    historyDays: 7,
  })

  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      l.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase())

    const isExpired = new Date(l.validUntil) < new Date()
    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && l.isActive && !isExpired) ||
      (filterActive === 'expired' && (!l.isActive || isExpired))

    return matchesSearch && matchesFilter
  })

  const copyLink = useCallback((link: SharedLink) => {
    const url = `${window.location.origin}/track/${link.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleCreate = useCallback(() => {
    if (!newLink.vehicleName.trim() || !newLink.recipientName.trim()) return

    const link: SharedLink = {
      id: String(Date.now()),
      token: Math.random().toString(36).substring(2, 14),
      vehicleId: 'new',
      vehicleName: newLink.vehicleName,
      vehiclePlate: '??-???-??',
      recipientName: newLink.recipientName,
      recipientEmail: newLink.recipientEmail || undefined,
      validUntil: new Date(Date.now() + 86400000 * newLink.validDays).toISOString(),
      historyDays: newLink.historyDays,
      isActive: true,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    }

    setLinks((prev) => [link, ...prev])
    setNewLink({ vehicleName: '', recipientName: '', recipientEmail: '', validDays: 7, historyDays: 7 })
    setShowCreateDialog(false)
  }, [newLink])

  const toggleActive = useCallback((id: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    )
  }, [])

  const deleteLink = useCallback((id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const activeCount = links.filter(
    (l) => l.isActive && new Date(l.validUntil) > new Date()
  ).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-500" />
            Liens de suivi partagés
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Partagez la position de vos véhicules avec des tiers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau lien
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{links.length}</p>
              <p className="text-xs text-gray-500">Total des liens</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {links.reduce((sum, l) => sum + l.viewCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Vues totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par véhicule, destinataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'expired'] as const).map((f) => (
            <Button
              key={f}
              variant={filterActive === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(f)}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Expirés'}
            </Button>
          ))}
        </div>
      </div>

      {/* Links list */}
      <div className="space-y-2">
        {filteredLinks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Link2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun lien trouvé</p>
              <p className="text-sm mt-1">Créez un lien pour partager la position d'un véhicule</p>
            </CardContent>
          </Card>
        ) : (
          filteredLinks.map((link) => {
            const isExpired = new Date(link.validUntil) < new Date()
            return (
              <Card
                key={link.id}
                className={`transition ${isExpired ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm">{link.vehicleName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {link.vehiclePlate}
                        </Badge>
                        {isExpired ? (
                          <Badge className="text-[10px] bg-red-500/20 text-red-400">Expiré</Badge>
                        ) : link.isActive ? (
                          <Badge className="text-[10px] bg-green-500/20 text-green-400">Actif</Badge>
                        ) : (
                          <Badge className="text-[10px] bg-gray-500/20 text-gray-400">Désactivé</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {link.recipientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expire le {formatDateTime(link.validUntil)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {link.viewCount} vues
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(link)}
                        title="Copier le lien"
                      >
                        {copiedId === link.id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <a
                        href={`/track/${link.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" title="Ouvrir">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(link.id)}
                        title={link.isActive ? 'Désactiver' : 'Activer'}
                      >
                        <Shield className={`h-4 w-4 ${link.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLink(link.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau lien de suivi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Véhicule</label>
              <Input
                value={newLink.vehicleName}
                onChange={(e) => setNewLink((p) => ({ ...p, vehicleName: e.target.value }))}
                placeholder="Nom ou plaque du véhicule"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Destinataire</label>
              <Input
                value={newLink.recipientName}
                onChange={(e) => setNewLink((p) => ({ ...p, recipientName: e.target.value }))}
                placeholder="Nom du destinataire"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email (optionnel)</label>
              <Input
                type="email"
                value={newLink.recipientEmail}
                onChange={(e) => setNewLink((p) => ({ ...p, recipientEmail: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Durée de validité</label>
                <select
                  value={newLink.validDays}
                  onChange={(e) => setNewLink((p) => ({ ...p, validDays: Number(e.target.value) }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value={1}>1 jour</option>
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Historique visible</label>
                <select
                  value={newLink.historyDays}
                  onChange={(e) => setNewLink((p) => ({ ...p, historyDays: Number(e.target.value) }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value={1}>1 jour</option>
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newLink.vehicleName.trim() || !newLink.recipientName.trim()}
            >
              Créer le lien
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
