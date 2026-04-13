import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Shield, Plus, Edit2, Trash2, Users, Car, MapPin, Bell, FileText, Settings, Lock, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
const PERMISSION_CATEGORIES = [
    { category: 'Véhicules', permissions: ['vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.delete'], labels: ['Voir', 'Créer', 'Modifier', 'Supprimer'], icon: Car },
    { category: 'Carte', permissions: ['map.view', 'map.track', 'map.replay'], labels: ['Voir', 'Suivi temps réel', 'Historique'], icon: MapPin },
    { category: 'Alertes', permissions: ['alerts.view', 'alerts.create', 'alerts.manage', 'alerts.acknowledge'], labels: ['Voir', 'Créer règles', 'Gérer', 'Acquitter'], icon: Bell },
    { category: 'Rapports', permissions: ['reports.view', 'reports.generate', 'reports.export', 'reports.schedule'], labels: ['Voir', 'Générer', 'Exporter', 'Programmer'], icon: FileText },
    { category: 'Paramètres', permissions: ['settings.view', 'settings.edit', 'settings.users', 'settings.billing'], labels: ['Voir', 'Modifier', 'Utilisateurs', 'Facturation'], icon: Settings },
];
const DEFAULT_ROLES = [
    { id: 'super_admin', name: 'Super Admin', description: 'Accès complet au système', permissions: ['*'], userCount: 1, isSystem: true },
    { id: 'admin', name: 'Admin', description: 'Gestion complète de l\'organisation', permissions: ['vehicles.*', 'map.*', 'alerts.*', 'reports.*', 'settings.view', 'settings.edit', 'settings.users'], userCount: 2, isSystem: true },
    { id: 'manager', name: 'Manager', description: 'Supervision de la flotte', permissions: ['vehicles.view', 'vehicles.edit', 'map.*', 'alerts.view', 'alerts.acknowledge', 'reports.view', 'reports.generate'], userCount: 5, isSystem: true },
    { id: 'operator', name: 'Opérateur', description: 'Suivi quotidien des véhicules', permissions: ['vehicles.view', 'map.view', 'map.track', 'alerts.view', 'alerts.acknowledge'], userCount: 12, isSystem: true },
    { id: 'driver', name: 'Conducteur', description: 'Accès limité à son véhicule', permissions: ['vehicles.view', 'map.view'], userCount: 24, isSystem: true },
];
export default function RolesPermissionsPage() {
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const queryClient = useQueryClient();
    const [roles, setRoles] = useState(DEFAULT_ROLES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState(new Set());
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');
    const [inviteError, setInviteError] = useState('');
    // Fetch collaborators
    const { data: collaborators = [] } = useQuery({
        queryKey: ['collaborators', organizationId],
        queryFn: async () => {
            if (!organizationId)
                return [];
            try {
                const response = await apiClient.get(`/api/organizations/${organizationId}/users`);
                const d = response.data;
                return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
            }
            catch {
                return [];
            }
        },
        enabled: !!organizationId,
    });
    // Invite user mutation
    const inviteMutation = useMutation({
        mutationFn: async (data) => {
            return await apiClient.post(`/api/organizations/${organizationId}/users/invite`, data);
        },
        onSuccess: () => {
            setInviteEmail('');
            setInviteRole('');
            setInviteError('');
            setIsInviteModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['collaborators', organizationId] });
        },
        onError: (error) => {
            setInviteError(error.response?.data?.message || 'Erreur lors de l\'invitation');
        },
    });
    // Revoke user invitation mutation
    const revokeMutation = useMutation({
        mutationFn: async (userId) => {
            return await apiClient.delete(`/api/organizations/${organizationId}/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborators', organizationId] });
        },
    });
    const handleCreateRole = () => {
        setEditingRole(null);
        setNewRoleName('');
        setNewRoleDesc('');
        setSelectedPermissions(new Set());
        setIsModalOpen(true);
    };
    const handleEditRole = (role) => {
        setEditingRole(role);
        setNewRoleName(role.name);
        setNewRoleDesc(role.description);
        setSelectedPermissions(new Set(role.permissions));
        setIsModalOpen(true);
    };
    const handleSaveRole = () => {
        if (!newRoleName)
            return;
        if (editingRole) {
            setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, name: newRoleName, description: newRoleDesc, permissions: Array.from(selectedPermissions) } : r));
        }
        else {
            const newRole = {
                id: `custom_${Date.now()}`,
                name: newRoleName,
                description: newRoleDesc,
                permissions: Array.from(selectedPermissions),
                userCount: 0,
                isSystem: false,
            };
            setRoles(prev => [...prev, newRole]);
        }
        setIsModalOpen(false);
    };
    const togglePermission = (perm) => {
        setSelectedPermissions(prev => {
            const next = new Set(prev);
            if (next.has(perm))
                next.delete(perm);
            else
                next.add(perm);
            return next;
        });
    };
    const handleDeleteRole = (roleId) => {
        if (confirm('Supprimer ce rôle personnalisé ?')) {
            setRoles(prev => prev.filter(r => r.id !== roleId));
        }
    };
    const handleSendInvite = async () => {
        if (!inviteEmail.trim() || !inviteRole) {
            setInviteError('Veuillez remplir tous les champs');
            return;
        }
        setInviteError('');
        await inviteMutation.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
    };
    return (_jsxs("div", { className: "space-y-6 min-h-screen bg-[#F5F7FA] p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 font-sans", children: "R\u00F4les et permissions" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "G\u00E9rez les r\u00F4les d'acc\u00E8s et les permissions de votre organisation" })] }), _jsxs(Button, { onClick: handleCreateRole, className: "gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6]", children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er un r\u00F4le"] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: roles.map(role => (_jsxs(Card, { className: "flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-base text-gray-900 font-sans", children: [_jsx(Shield, { size: 16, className: role.isSystem ? 'text-blue-600' : 'text-amber-500' }), role.name] }), _jsx(CardDescription, { className: "mt-1 text-gray-500", children: role.description })] }), role.isSystem && _jsx(Badge, { variant: "secondary", className: "bg-gray-100 text-blue-600 border border-blue-600", children: "Syst\u00E8me" })] }) }), _jsxs(CardContent, { className: "flex-1 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx(Users, { size: 14 }), _jsxs("span", { children: [role.userCount, " utilisateur", role.userCount > 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx(Lock, { size: 14 }), _jsx("span", { children: role.permissions.includes('*') ? 'Toutes les permissions' : `${role.permissions.length} permission${role.permissions.length > 1 ? 's' : ''}` })] }), _jsxs("div", { className: "flex gap-2 pt-2 border-t border-gray-200", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 bg-white border-gray-200 text-gray-900 hover:bg-gray-100", onClick: () => handleEditRole(role), children: [_jsx(Edit2, { size: 14, className: "mr-1" }), "Modifier"] }), !role.isSystem && (_jsx(Button, { variant: "outline", size: "sm", className: "text-red-500 border-gray-200 bg-white hover:bg-gray-100", onClick: () => handleDeleteRole(role.id), children: _jsx(Trash2, { size: 14 }) }))] })] })] }, role.id))) }), _jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-gray-900 font-sans", children: [_jsx(Users, { size: 18 }), "Collaborateurs"] }), _jsx(CardDescription, { className: "text-gray-500", children: "G\u00E9rez les acc\u00E8s des membres de votre organisation" })] }), _jsxs(Button, { onClick: () => setIsInviteModalOpen(true), className: "gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6]", children: [_jsx(UserPlus, { size: 14 }), "Inviter"] })] }) }), _jsx(CardContent, { className: "space-y-4", children: collaborators.length === 0 ? (_jsx("div", { className: "text-sm text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-lg bg-white", children: "Aucun collaborateur pour le moment" })) : (_jsx("div", { className: "space-y-2", children: (Array.isArray(collaborators) ? collaborators : []).map((collab) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 bg-white rounded-lg hover:bg-blue-50/50", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: collab.email }), _jsx("p", { className: "text-xs text-gray-500", children: collab.role || 'Rôle non assigné' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs border-gray-200 bg-white text-gray-900", children: collab.status === 'pending' ? 'En attente' : 'Actif' }), collab.status === 'pending' && (_jsxs(Button, { variant: "ghost", size: "sm", className: "text-red-500 hover:text-[#FF6B7F] hover:bg-gray-100", onClick: () => revokeMutation.mutate(collab.id), disabled: revokeMutation.isPending, children: [_jsx(Trash2, { size: 14 }), "R\u00E9voquer"] }))] })] }, collab.id))) })) })] }), _jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-gray-900 font-sans", children: "Restrictions temporelles" }), _jsx(CardDescription, { className: "text-gray-500", children: "Limitez l'acc\u00E8s \u00E0 certaines heures pour des r\u00F4les sp\u00E9cifiques" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 bg-white rounded-lg hover:bg-blue-50/50", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: "Op\u00E9rateurs" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acc\u00E8s limit\u00E9 de 06:00 \u00E0 22:00" })] }), _jsx(Badge, { variant: "outline", className: "border-gray-200 bg-white text-gray-900", children: "Actif" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 bg-white rounded-lg hover:bg-blue-50/50", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: "Conducteurs" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acc\u00E8s limit\u00E9 de 05:00 \u00E0 23:00" })] }), _jsx(Badge, { variant: "outline", className: "border-gray-200 bg-white text-gray-900", children: "Actif" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 bg-white rounded-lg hover:bg-blue-50/50", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: "Sous-traitants" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acc\u00E8s temporaire \u2014 expire le 30/04/2026" })] }), _jsx(Badge, { className: "bg-amber-500 text-[#FFFFFF] font-bold", children: "Temporaire" })] }), _jsx(Button, { variant: "outline", className: "w-full bg-white border-gray-200 text-gray-900 hover:bg-gray-100", children: "Configurer les restrictions" })] })] }), _jsx(Dialog, { open: isInviteModalOpen, onOpenChange: setIsInviteModalOpen, children: _jsxs(DialogContent, { className: "max-w-md bg-white border border-gray-200 rounded-xl shadow-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Inviter un collaborateur" }), _jsx(DialogDescription, { className: "text-gray-500", children: "Envoyez une invitation \u00E0 un nouveau membre de votre organisation" })] }), _jsxs("div", { className: "space-y-4 py-4", children: [inviteError && (_jsxs("div", { className: "flex gap-2 p-3 bg-gray-100 border border-red-500 rounded-lg", children: [_jsx(AlertCircle, { size: 16, className: "text-red-500 flex-shrink-0" }), _jsx("p", { className: "text-sm text-red-500", children: inviteError })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Email" }), _jsx(Input, { type: "email", placeholder: "collaborateur@exemple.com", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), className: "bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "R\u00F4le" }), _jsxs("select", { value: inviteRole, onChange: (e) => setInviteRole(e.target.value), className: "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600", children: [_jsx("option", { value: "", className: "bg-white", children: "S\u00E9lectionner un r\u00F4le" }), roles.map((r) => (_jsx("option", { value: r.id, className: "bg-white", children: r.name }, r.id)))] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsInviteModalOpen(false), className: "bg-white border-gray-200 text-gray-900 hover:bg-gray-100", children: "Annuler" }), _jsxs(Button, { onClick: handleSendInvite, disabled: inviteMutation.isPending, className: "gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6]", children: [inviteMutation.isPending && _jsx(Loader2, { size: 14, className: "animate-spin" }), "Inviter"] })] })] }) }), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-lg max-h-[80vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: editingRole ? 'Modifier le rôle' : 'Créer un rôle' }), _jsx(DialogDescription, { className: "text-gray-500", children: "D\u00E9finissez les permissions pour ce r\u00F4le" })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Nom du r\u00F4le" }), _jsx(Input, { value: newRoleName, onChange: e => setNewRoleName(e.target.value), placeholder: "Ex: Superviseur terrain", className: "bg-white border-gray-200 text-gray-900 rounded-lg placeholder-[#9CA3AF] focus:border-blue-600" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Description" }), _jsx(Input, { value: newRoleDesc, onChange: e => setNewRoleDesc(e.target.value), placeholder: "D\u00E9crivez ce r\u00F4le...", className: "bg-white border-gray-200 text-gray-900 rounded-lg placeholder-[#9CA3AF] focus:border-blue-600" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Permissions" }), PERMISSION_CATEGORIES.map(cat => (_jsxs("div", { className: "border border-gray-200 bg-white rounded-lg p-3 hover:bg-blue-50/50", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(cat.icon, { size: 14, className: "text-gray-500" }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: cat.category })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: cat.permissions.map((perm, idx) => (_jsx("button", { onClick: () => togglePermission(perm), className: `px-2 py-1 rounded text-xs font-medium transition-colors ${selectedPermissions.has(perm)
                                                            ? 'bg-blue-600 text-white border border-blue-600'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'}`, children: cat.labels[idx] }, perm))) })] }, cat.category)))] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsModalOpen(false), className: "bg-white border-gray-200 text-gray-900 hover:bg-gray-100", children: "Annuler" }), _jsx(Button, { onClick: handleSaveRole, className: "bg-blue-600 text-white font-bold hover:bg-[#3B82F6]", children: editingRole ? 'Mettre à jour' : 'Créer' })] })] }) })] }));
}
//# sourceMappingURL=RolesPermissionsPage.js.map