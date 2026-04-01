import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Shield, Plus, Edit2, Trash2, Users, Car, MapPin, Bell, FileText, Settings, Lock } from 'lucide-react'

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
  const [roles, setRoles] = useState<CustomRole[]>(DEFAULT_ROLES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rôles et permissions</h1>
          <p className="mt-1 text-sm text-gray-600">Gérez les rôles d'accès et les permissions de votre organisation</p>
        </div>
        <Button onClick={handleCreateRole} className="gap-2">
          <Plus size={16} />
          Créer un rôle
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <Card key={role.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield size={16} className={role.isSystem ? 'text-blue-600' : 'text-purple-600'} />
                    {role.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{role.description}</CardDescription>
                </div>
                {role.isSystem && <Badge variant="secondary">Système</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={14} />
                <span>{role.userCount} utilisateur{role.userCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock size={14} />
                <span>{role.permissions.includes('*') ? 'Toutes les permissions' : `${role.permissions.length} permission${role.permissions.length > 1 ? 's' : ''}`}</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditRole(role)}>
                  <Edit2 size={14} className="mr-1" />
                  Modifier
                </Button>
                {!role.isSystem && (
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteRole(role.id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invitation System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Système d'invitation
          </CardTitle>
          <CardDescription>Invitez de nouveaux membres à rejoindre votre organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input placeholder="Email du nouveau membre" className="flex-1" />
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <Button className="gap-2">
              <Plus size={14} />
              Inviter
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Invitations en attente</p>
            <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              Aucune invitation en attente
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>Restrictions temporelles</CardTitle>
          <CardDescription>Limitez l'accès à certaines heures pour des rôles spécifiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div>
              <p className="font-medium text-sm text-gray-900">Opérateurs</p>
              <p className="text-xs text-gray-500">Accès limité de 06:00 à 22:00</p>
            </div>
            <Badge variant="outline">Actif</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div>
              <p className="font-medium text-sm text-gray-900">Conducteurs</p>
              <p className="text-xs text-gray-500">Accès limité de 05:00 à 23:00</p>
            </div>
            <Badge variant="outline">Actif</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div>
              <p className="font-medium text-sm text-gray-900">Sous-traitants</p>
              <p className="text-xs text-gray-500">Accès temporaire — expire le 30/04/2026</p>
            </div>
            <Badge className="bg-orange-100 text-orange-700">Temporaire</Badge>
          </div>
          <Button variant="outline" className="w-full">Configurer les restrictions</Button>
        </CardContent>
      </Card>

      {/* Create/Edit Role Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Modifier le rôle' : 'Créer un rôle'}</DialogTitle>
            <DialogDescription>Définissez les permissions pour ce rôle</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du rôle</label>
              <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Ex: Superviseur terrain" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="Décrivez ce rôle..." />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Permissions</label>
              {PERMISSION_CATEGORIES.map(cat => (
                <div key={cat.category} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <cat.icon size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.permissions.map((perm, idx) => (
                      <button
                        key={perm}
                        onClick={() => togglePermission(perm)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selectedPermissions.has(perm)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveRole}>{editingRole ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
