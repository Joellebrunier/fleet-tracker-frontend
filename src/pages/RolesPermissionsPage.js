import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Shield, Plus, Edit2, Trash2, Users, Car, MapPin, Bell, FileText, Settings, Lock } from 'lucide-react';
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
    const [roles, setRoles] = useState(DEFAULT_ROLES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState(new Set());
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
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "R\u00F4les et permissions" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "G\u00E9rez les r\u00F4les d'acc\u00E8s et les permissions de votre organisation" })] }), _jsxs(Button, { onClick: handleCreateRole, className: "gap-2", children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er un r\u00F4le"] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: roles.map(role => (_jsxs(Card, { className: "flex flex-col", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Shield, { size: 16, className: role.isSystem ? 'text-blue-600' : 'text-purple-600' }), role.name] }), _jsx(CardDescription, { className: "mt-1", children: role.description })] }), role.isSystem && _jsx(Badge, { variant: "secondary", children: "Syst\u00E8me" })] }) }), _jsxs(CardContent, { className: "flex-1 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Users, { size: 14 }), _jsxs("span", { children: [role.userCount, " utilisateur", role.userCount > 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Lock, { size: 14 }), _jsx("span", { children: role.permissions.includes('*') ? 'Toutes les permissions' : `${role.permissions.length} permission${role.permissions.length > 1 ? 's' : ''}` })] }), _jsxs("div", { className: "flex gap-2 pt-2 border-t border-gray-100", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1", onClick: () => handleEditRole(role), children: [_jsx(Edit2, { size: 14, className: "mr-1" }), "Modifier"] }), !role.isSystem && (_jsx(Button, { variant: "outline", size: "sm", className: "text-red-600", onClick: () => handleDeleteRole(role.id), children: _jsx(Trash2, { size: 14 }) }))] })] })] }, role.id))) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Users, { size: 18 }), "Syst\u00E8me d'invitation"] }), _jsx(CardDescription, { children: "Invitez de nouveaux membres \u00E0 rejoindre votre organisation" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx(Input, { placeholder: "Email du nouveau membre", className: "flex-1" }), _jsx("select", { className: "rounded-md border border-gray-300 px-3 py-2 text-sm", children: roles.map(r => _jsx("option", { value: r.id, children: r.name }, r.id)) }), _jsxs(Button, { className: "gap-2", children: [_jsx(Plus, { size: 14 }), "Inviter"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Invitations en attente" }), _jsx("div", { className: "text-sm text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-lg", children: "Aucune invitation en attente" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Restrictions temporelles" }), _jsx(CardDescription, { children: "Limitez l'acc\u00E8s \u00E0 certaines heures pour des r\u00F4les sp\u00E9cifiques" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: "Op\u00E9rateurs" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acc\u00E8s limit\u00E9 de 06:00 \u00E0 22:00" })] }), _jsx(Badge, { variant: "outline", children: "Actif" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: "Conducteurs" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acc\u00E8s limit\u00E9 de 05:00 \u00E0 23:00" })] }), _jsx(Badge, { variant: "outline", children: "Actif" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-100 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: "Sous-traitants" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acc\u00E8s temporaire \u2014 expire le 30/04/2026" })] }), _jsx(Badge, { className: "bg-orange-100 text-orange-700", children: "Temporaire" })] }), _jsx(Button, { variant: "outline", className: "w-full", children: "Configurer les restrictions" })] })] }), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-lg max-h-[80vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingRole ? 'Modifier le rôle' : 'Créer un rôle' }), _jsx(DialogDescription, { children: "D\u00E9finissez les permissions pour ce r\u00F4le" })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Nom du r\u00F4le" }), _jsx(Input, { value: newRoleName, onChange: e => setNewRoleName(e.target.value), placeholder: "Ex: Superviseur terrain" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx(Input, { value: newRoleDesc, onChange: e => setNewRoleDesc(e.target.value), placeholder: "D\u00E9crivez ce r\u00F4le..." })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium", children: "Permissions" }), PERMISSION_CATEGORIES.map(cat => (_jsxs("div", { className: "border border-gray-100 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(cat.icon, { size: 14, className: "text-gray-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: cat.category })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: cat.permissions.map((perm, idx) => (_jsx("button", { onClick: () => togglePermission(perm), className: `px-2 py-1 rounded text-xs font-medium transition-colors ${selectedPermissions.has(perm)
                                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            : 'bg-gray-50 text-gray-500 border border-gray-200'}`, children: cat.labels[idx] }, perm))) })] }, cat.category)))] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsModalOpen(false), children: "Annuler" }), _jsx(Button, { onClick: handleSaveRole, children: editingRole ? 'Mettre à jour' : 'Créer' })] })] }) })] }));
}
//# sourceMappingURL=RolesPermissionsPage.js.map