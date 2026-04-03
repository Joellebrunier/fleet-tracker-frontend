import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Shield, Plus, Edit2, Trash2, Users, Car, MapPin, Bell, FileText, Settings, Lock, UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface CustomRole {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
}

const PERMISSION_CATEGORIES = [
  { category: 'Véhicules', permissions: ['vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.delete'], labels: ['Voir', 'Créer', 'Modifier', 'Supprimer'], icon: Car },
  { category: 'Carte', permissions: ['map.view', 'map.track', 'map.replay'], labels: ['Voir', 'Suivi temps réel', 'Historique'], icon: MapPin },
  { category: 'Alertes', permissions: ['alerts.view', 'alerts.create', 'alerts.manage', 'alerts.acknowledge'], labels: ['Voir', 'Créer règles', 'Gérer', 'Acquitter'], icon: Bell },
  { category: 'Rapports', permissions: ['reports.view', 'reports.generate', 'reports.export', 'reports.schedule'], labels: ['Voir', 'Générer', 'Exporter', 'Programmer'], icon: FileText },
  { category: 'Paramètres', permissions: ['settings.view', 'settings.edit', 'settings.users', 'settings.billing'], labels: ['Voir', 'Modifier', 'Utilisateurs', 'Facturation'], icon: Settings },
]

const DEFAULT_ROLES: CustomRole[] = [
  { id: 'super_admin', name: 'Super Admin', description: 'Accès complet au système', permissions: ['*'], userCount: 1, isSystem: true },
  { id: 'admin', name: 'Admin', description: 'Gestion complète de l\'organisation', permissions: ['vehicles.*', 'map.*', 'alerts.*', 'reports.*', 'settings.view', 'settings.edit', 'settings.users'], userCount: 2, isSystem: true },
  { id: 'manager', name: 'Manager', description: 'Supervision de la flotte', permissions: ['vehicles.view', 'vehicles.edit', 'map.*', 'alerts.view', 'alerts.acknowledge', 'reports.view', 'reports.generate'], userCount: 5, isSystem: true },
  { id: 'operator', name: 'Opérateur', description: 'Suivi quotidien des véhicules', permissions: ['vehicles.view', 'map.view', 'map.track', 'alerts.view', 'alerts.acknowledge'], userCount: 12, isSystem: true },
  { id: 'driver', name: 'Conducteur', description: 'Accès limité à son véhicule', permissions: ['vehicles.view', 'map.view'], userCount: 24, isSystem: true },
]

export default function RolesPermissionsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const queryClient = useQueryClient()

  const [roles, setRoles] = useState<CustomRole[]>(DEFAULT_ROLES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteError, setInviteError] = useState('')

  // Fetch collaborators
  const { data: collaborators = [] } = useQuery({
    queryKey: ['collaborators', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      try {
        const response = await apiClient.get(`/api/organizations/${organizationId}/users`)
        const d = response.data
        return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
      } catch {
        return []
      }
    },
    enabled: !!organizationId,
  })

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      return await apiClient.post(
        `/api/organizations/${organizationId}/users/invite`,
        data
      )
    },
    onSuccess: () => {
      setInviteEmail('')
      setInviteRole('')
      setInviteError('')
      setIsInviteModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['collaborators', organizationId] })
    },
    onError: (error: any) => {
      setInviteError(error.response?.data?.message || 'Erreur lors de l\'invitation')
    },
  })

  // Revoke user invitation mutation
  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiClient.delete(
        `/api/organizations/${organizationId}/users/${userId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', organizationId] })
    },
  })

  const handleCreateRole = () => {
    setEditingRole(null)
    setNewRoleName('')
    setNewRoleDesc('')
    setSelectedPermissions(new Set())
    setIsModalOpen(true)
  }

  const handleEditRole = (role: CustomRole) => {
    setEditingRole(role)
    setNewRoleName(role.name)
    setNewRoleDesc(role.description)
    setSelectedPermissions(new Set(role.permissions))
    setIsModalOpen(true)
  }

  const handleSaveRole = () => {
    if (!newRoleName) return
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, name: newRoleName, description: newRoleDesc, permissions: Array.from(selectedPermissions) } : r))
    } else {
      const newRole: CustomRole = {
        id: `custom_${Date.now()}`,
        name: newRoleName,
        description: newRoleDesc,
        permissions: Array.from(selectedPermissions),
        userCount: 0,
        isSystem: false,
      }
      setRoles(prev => [...prev, newRole])
    }
    setIsModalOpen(false)
  }

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev)
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return next
    })
  }

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Supprimer ce rôle personnalisé ?')) {
      setRoles(prev => prev.filter(r => r.id !== roleId))
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteRole) {
      setInviteError('Veuillez remplir tous les champs')
      return
    }
    setInviteError('')
    await inviteMutation.mutateAsync({ email: inviteEmail.trim(), role: inviteRole })
  }

  return (
    <div className="space-y-6 p-6 bg-[#0A0A0F] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Rôles et permissions</h1>
          <p className="mt-1 text-sm text-[#6B6B80]">Gérez les rôles d'accès et les permissions de votre organisation</p>
        </div>
        <Button onClick={handleCreateRole} className="gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00D4B8]">
          <Plus size={16} />
          Créer un rôle
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <Card key={role.id} className="flex flex-col bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base text-[#F0F0F5] font-syne">
                    <Shield size={16} className={role.isSystem ? 'text-[#00E5CC]' : 'text-[#FFB547]'} />
                    {role.name}
                  </CardTitle>
                  <CardDescription className="mt-1 text-[#6B6B80]">{role.description}</CardDescription>
                </div>
                {role.isSystem && <Badge variant="secondary" className="bg-[#1A1A25] text-[#00E5CC] border border-[#00E5CC]">Système</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#6B6B80]">
                <Users size={14} />
                <span>{role.userCount} utilisateur{role.userCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6B6B80]">
                <Lock size={14} />
                <span>{role.permissions.includes('*') ? 'Toutes les permissions' : `${role.permissions.length} permission${role.permissions.length > 1 ? 's' : ''}`}</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#1F1F2E]">
                <Button variant="outline" size="sm" className="flex-1 bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25]" onClick={() => handleEditRole(role)}>
                  <Edit2 size={14} className="mr-1" />
                  Modifier
                </Button>
                {!role.isSystem && (
                  <Button variant="outline" size="sm" className="text-[#FF4D6A] border-[#1F1F2E] bg-[#12121A] hover:bg-[#1A1A25]" onClick={() => handleDeleteRole(role.id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Collaborators Section */}
      <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[#F0F0F5] font-syne">
                <Users size={18} />
                Collaborateurs
              </CardTitle>
              <CardDescription className="text-[#6B6B80]">Gérez les accès des membres de votre organisation</CardDescription>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00D4B8]">
              <UserPlus size={14} />
              Inviter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {collaborators.length === 0 ? (
            <div className="text-sm text-[#6B6B80] text-center py-4 border border-dashed border-[#1F1F2E] rounded-lg bg-[#0A0A0F]">
              Aucun collaborateur pour le moment
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(collaborators) ? collaborators : []).map((collab: any) => (
                <div key={collab.id} className="flex items-center justify-between p-3 border border-[#1F1F2E] bg-[#0A0A0F] rounded-lg hover:bg-[#1A1A25]">
                  <div>
                    <p className="font-medium text-sm text-[#F0F0F5]">{collab.email}</p>
                    <p className="text-xs text-[#6B6B80]">{collab.role || 'Rôle non assigné'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5]">
                      {collab.status === 'pending' ? 'En attente' : 'Actif'}
                    </Badge>
                    {collab.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#FF4D6A] hover:text-[#FF6B7F] hover:bg-[#1A1A25]"
                        onClick={() => revokeMutation.mutate(collab.id)}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 size={14} />
                        Révoquer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Restrictions */}
      <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
        <CardHeader>
          <CardTitle className="text-[#F0F0F5] font-syne">Restrictions temporelles</CardTitle>
          <CardDescription className="text-[#6B6B80]">Limitez l'accès à certaines heures pour des rôles spécifiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-[#1F1F2E] bg-[#0A0A0F] rounded-lg hover:bg-[#1A1A25]">
            <div>
              <p className="font-medium text-sm text-[#F0F0F5]">Opérateurs</p>
              <p className="text-xs text-[#6B6B80]">Accès limité de 06:00 à 22:00</p>
            </div>
            <Badge variant="outline" className="border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5]">Actif</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border border-[#1F1F2E] bg-[#0A0A0F] rounded-lg hover:bg-[#1A1A25]">
            <div>
              <p className="font-medium text-sm text-[#F0F0F5]">Conducteurs</p>
              <p className="text-xs text-[#6B6B80]">Accès limité de 05:00 à 23:00</p>
            </div>
            <Badge variant="outline" className="border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5]">Actif</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border border-[#1F1F2E] bg-[#0A0A0F] rounded-lg hover:bg-[#1A1A25]">
            <div>
              <p className="font-medium text-sm text-[#F0F0F5]">Sous-traitants</p>
              <p className="text-xs text-[#6B6B80]">Accès temporaire — expire le 30/04/2026</p>
            </div>
            <Badge className="bg-[#FFB547] text-[#0A0A0F] font-bold">Temporaire</Badge>
          </div>
          <Button variant="outline" className="w-full bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25]">Configurer les restrictions</Button>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Inviter un collaborateur</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">Envoyez une invitation à un nouveau membre de votre organisation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {inviteError && (
              <div className="flex gap-2 p-3 bg-[#1A1A25] border border-[#FF4D6A] rounded-lg">
                <AlertCircle size={16} className="text-[#FF4D6A] flex-shrink-0" />
                <p className="text-sm text-[#FF4D6A]">{inviteError}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Email</label>
              <Input
                type="email"
                placeholder="collaborateur@exemple.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] placeholder-[#44445A] focus:border-[#00E5CC]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Rôle</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC]"
              >
                <option value="" className="bg-[#12121A]">Sélectionner un rôle</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#12121A]">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)} className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25]">
              Annuler
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={inviteMutation.isPending}
              className="gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00D4B8]"
            >
              {inviteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Inviter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">{editingRole ? 'Modifier le rôle' : 'Créer un rôle'}</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">Définissez les permissions pour ce rôle</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Nom du rôle</label>
              <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Ex: Superviseur terrain" className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] placeholder-[#44445A] focus:border-[#00E5CC]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Description</label>
              <Input value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="Décrivez ce rôle..." className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] placeholder-[#44445A] focus:border-[#00E5CC]" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#F0F0F5]">Permissions</label>
              {PERMISSION_CATEGORIES.map(cat => (
                <div key={cat.category} className="border border-[#1F1F2E] bg-[#0A0A0F] rounded-lg p-3 hover:bg-[#1A1A25]">
                  <div className="flex items-center gap-2 mb-2">
                    <cat.icon size={14} className="text-[#6B6B80]" />
                    <span className="text-sm font-medium text-[#F0F0F5]">{cat.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.permissions.map((perm, idx) => (
                      <button
                        key={perm}
                        onClick={() => togglePermission(perm)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selectedPermissions.has(perm)
                            ? 'bg-[#00E5CC] text-[#0A0A0F] border border-[#00E5CC]'
                            : 'bg-[#1A1A25] text-[#6B6B80] border border-[#1F1F2E]'
                        }`}
                      >
                        {cat.labels[idx]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25]">Annuler</Button>
            <Button onClick={handleSaveRole} className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00D4B8]">{editingRole ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
