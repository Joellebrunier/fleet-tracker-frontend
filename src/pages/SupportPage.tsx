import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Send,
  MessageSquare,
  Clock,
  Paperclip,
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LifeBuoy,
  Filter,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TicketStatus = 'open' | 'in_progress' | 'closed'
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

interface TicketMessage {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: 'user' | 'support'
  content: string
  attachments?: { name: string; url: string }[]
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
  unreadCount?: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  closed: 'Fermé',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  normal: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
}

const CATEGORIES = [
  'Problème technique',
  'GPS / Tracking',
  'Facturation',
  'Compte / Accès',
  'Fonctionnalité',
  'Autre',
]

/* ------------------------------------------------------------------ */
/*  Mock data (will be replaced by API calls once backend ready)       */
/* ------------------------------------------------------------------ */

const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    subject: 'Véhicule HJ-180-PW ne remonte plus de position',
    description: 'Depuis ce matin, le véhicule HJ-180-PW apparaît comme hors ligne alors qu\'il roule.',
    status: 'open',
    priority: 'high',
    category: 'GPS / Tracking',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      {
        id: 'm1',
        ticketId: '1',
        senderId: 'user1',
        senderName: 'Stéphane B.',
        senderRole: 'user',
        content: 'Depuis ce matin, le véhicule HJ-180-PW apparaît comme hors ligne alors qu\'il roule. Pouvez-vous vérifier ?',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'm2',
        ticketId: '1',
        senderId: 'support1',
        senderName: 'Support Fleet Track',
        senderRole: 'support',
        content: 'Bonjour, nous vérifions le boîtier GPS de ce véhicule. Pouvez-vous nous confirmer que le boîtier est bien alimenté ?',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    unreadCount: 1,
  },
  {
    id: '2',
    subject: 'Demande d\'ajout de 5 véhicules',
    description: 'Nous souhaitons ajouter 5 nouveaux véhicules à notre flotte.',
    status: 'in_progress',
    priority: 'normal',
    category: 'Compte / Accès',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        id: 'm3',
        ticketId: '2',
        senderId: 'user1',
        senderName: 'Stéphane B.',
        senderRole: 'user',
        content: 'Nous souhaitons ajouter 5 nouveaux véhicules. Pouvez-vous nous envoyer les boîtiers GPS ?',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    unreadCount: 0,
  },
  {
    id: '3',
    subject: 'Question sur l\'export des rapports',
    description: 'Comment exporter les rapports en PDF ?',
    status: 'closed',
    priority: 'low',
    category: 'Fonctionnalité',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    messages: [
      {
        id: 'm4',
        ticketId: '3',
        senderId: 'user1',
        senderName: 'Stéphane B.',
        senderRole: 'user',
        content: 'Comment exporter les rapports en PDF ?',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'm5',
        ticketId: '3',
        senderId: 'support1',
        senderName: 'Support Fleet Track',
        senderRole: 'support',
        content: 'Allez dans Rapports > Générer, sélectionnez vos filtres puis cliquez sur "Exporter PDF" en haut à droite.',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
    unreadCount: 0,
  },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SupportPage() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'normal' as TicketPriority,
    category: CATEGORIES[0],
  })

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedTicket?.messages.length])

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesSearch =
      !searchQuery ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Create ticket
  const handleCreateTicket = useCallback(() => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return

    const ticket: Ticket = {
      id: String(Date.now()),
      subject: newTicket.subject,
      description: newTicket.description,
      status: 'open',
      priority: newTicket.priority,
      category: newTicket.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: String(Date.now()),
          ticketId: String(Date.now()),
          senderId: user?.id || '',
          senderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Utilisateur',
          senderRole: 'user',
          content: newTicket.description,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 0,
    }

    setTickets((prev) => [ticket, ...prev])
    setNewTicket({ subject: '', description: '', priority: 'normal', category: CATEGORIES[0] })
    setShowCreateDialog(false)
    setSelectedTicket(ticket)
  }, [newTicket, user])

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)

    const msg: TicketMessage = {
      id: String(Date.now()),
      ticketId: selectedTicket.id,
      senderId: user?.id || '',
      senderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Utilisateur',
      senderRole: 'user',
      content: newMessage,
      createdAt: new Date().toISOString(),
    }

    const updated = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, msg],
      updatedAt: new Date().toISOString(),
    }

    setSelectedTicket(updated)
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setNewMessage('')
    setSending(false)
  }, [newMessage, selectedTicket, user])

  // Stats
  const openCount = tickets.filter((t) => t.status === 'open').length
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length

  /* ---------- Ticket detail view ---------- */
  if (selectedTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTicket(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{selectedTicket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={`text-[10px] ${STATUS_COLORS[selectedTicket.status]}`}>
                {STATUS_LABELS[selectedTicket.status]}
              </Badge>
              <Badge className={`text-[10px] ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                {PRIORITY_LABELS[selectedTicket.priority]}
              </Badge>
              <span className="text-xs text-gray-500">{selectedTicket.category}</span>
            </div>
          </div>
          {selectedTicket.status !== 'closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = { ...selectedTicket, status: 'closed' as TicketStatus }
                setSelectedTicket(updated)
                setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Fermer
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {selectedTicket.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  msg.senderRole === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-80">{msg.senderName}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.senderRole === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {formatDateTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedTicket.status !== 'closed' && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
        {selectedTicket.status === 'closed' && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-center">
            <p className="text-sm text-gray-500">
              Ce ticket est fermé.{' '}
              <button
                className="text-blue-500 hover:underline"
                onClick={() => {
                  const updated = { ...selectedTicket, status: 'open' as TicketStatus }
                  setSelectedTicket(updated)
                  setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
                }}
              >
                Réouvrir
              </button>
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ---------- Ticket list view ---------- */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-blue-500" />
            Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos demandes de support et tickets
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('open')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-xs text-gray-500">Ouverts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'open', 'in_progress', 'closed'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun ticket trouvé</p>
              <p className="text-sm mt-1">
                {statusFilter !== 'all'
                  ? 'Essayez de changer le filtre de statut'
                  : 'Créez un nouveau ticket pour contacter le support'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition hover:border-blue-500/30"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{ticket.subject}</h3>
                      {(ticket.unreadCount ?? 0) > 0 && (
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                          {ticket.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`text-[10px] ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                      <Badge className={`text-[10px] ${PRIORITY_COLORS[ticket.priority]}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </Badge>
                      <span className="text-[10px] text-gray-400">{ticket.category}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-[10px] text-gray-400">{formatDateTime(ticket.createdAt)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {ticket.messages.length} message{ticket.messages.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create ticket dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Sujet</label>
              <Input
                value={newTicket.subject}
                onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Décrivez brièvement votre problème"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Catégorie</label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priorité</label>
              <select
                value={newTicket.priority}
                onChange={(e) =>
                  setNewTicket((prev) => ({ ...prev, priority: e.target.value as TicketPriority }))
                }
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                {(Object.entries(PRIORITY_LABELS) as [TicketPriority, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Détaillez votre demande..."
                rows={4}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newTicket.subject.trim() || !newTicket.description.trim()}
            >
              Créer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
