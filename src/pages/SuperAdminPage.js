'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Users, Building2, BarChart3, Activity, Shield, Server, Database, Wifi, RefreshCw, Search, Eye, Plus, AlertTriangle, CheckCircle, Clock, } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/utils';
export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchOrg, setSearchOrg] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [orgStatusFilter, setOrgStatusFilter] = useState('all');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    // Fetch system health
    const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
        queryKey: ['super-admin-health'],
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_HEALTH || '/api/super-admin/health');
            return response.data;
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
    // Fetch system stats
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['super-admin-stats'],
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_STATS || '/api/super-admin/stats');
            return response.data;
        },
        refetchInterval: 60000, // Refetch every 60 seconds
    });
    // Fetch organizations
    const { data: organizations = [], isLoading: orgsLoading, refetch: refetchOrgs } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.ORGANIZATIONS || '/api/organizations');
            return response.data;
        },
    });
    // Fetch users
    const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['super-admin-users'],
        queryFn: async () => {
            const response = await apiClient.get('/api/super-admin/users');
            return response.data;
        },
    });
    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchOrg.toLowerCase()) ||
            org.id.toLowerCase().includes(searchOrg.toLowerCase());
        const matchesStatus = orgStatusFilter === 'all' || org.status === orgStatusFilter;
        return matchesSearch && matchesStatus;
    });
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
            user.name.toLowerCase().includes(searchUser.toLowerCase());
        const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
        return matchesSearch && matchesRole;
    });
    const handleRefreshAll = () => {
        refetchHealth();
        refetchStats();
        refetchOrgs();
        refetchUsers();
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'operational':
            case 'connected':
            case 'active':
                return 'bg-green-50';
            case 'degraded':
                return 'bg-yellow-50';
            case 'down':
            case 'disconnected':
            case 'suspended':
                return 'bg-red-50';
            default:
                return 'bg-gray-50';
        }
    };
    const getStatusTextColor = (status) => {
        switch (status) {
            case 'operational':
            case 'connected':
            case 'active':
                return 'text-green-600';
            case 'degraded':
                return 'text-yellow-600';
            case 'down':
            case 'disconnected':
            case 'suspended':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'operational':
            case 'connected':
            case 'active':
                return _jsx(CheckCircle, { className: "h-5 w-5 text-green-600" });
            case 'degraded':
                return _jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-600" });
            case 'down':
            case 'disconnected':
            case 'suspended':
                return _jsx(AlertTriangle, { className: "h-5 w-5 text-red-600" });
            default:
                return _jsx(Clock, { className: "h-5 w-5 text-gray-600" });
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between rounded-lg border-l-4 border-red-500 bg-red-50 p-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Administration syst\u00E8me" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Super admin uniquement \u2014 gestion de toutes les organisations et utilisateurs" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefreshAll, className: "gap-2", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Actualiser"] })] }), _jsx("div", { className: "flex gap-2 border-b border-gray-200", children: ['overview', 'organizations', 'users', 'config'].map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: [tab === 'overview' && 'Vue d\'ensemble', tab === 'organizations' && 'Organisations', tab === 'users' && 'Utilisateurs', tab === 'config' && 'Configuration'] }, tab))) }), activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-5", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Utilisateurs totaux" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-gray-900", children: stats?.totalUsers || 0 })] }), _jsx(Users, { className: "h-8 w-8 text-blue-600 opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Organisations" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-gray-900", children: stats?.totalOrganizations || 0 })] }), _jsx(Building2, { className: "h-8 w-8 text-green-600 opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "V\u00E9hicules totaux" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-gray-900", children: stats?.totalVehicles || 0 })] }), _jsx(BarChart3, { className: "h-8 w-8 text-purple-600 opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Traceurs actifs" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-gray-900", children: stats?.activeTrackers || 0 })] }), _jsx(Activity, { className: "h-8 w-8 text-orange-600 opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Alertes actives" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-gray-900", children: stats?.activeAlerts || 0 })] }), _jsx(AlertTriangle, { className: "h-8 w-8 text-red-600 opacity-20" })] }) })) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5" }), "Sant\u00E9 du syst\u00E8me"] }), _jsx(CardDescription, { children: "\u00C9tat en temps r\u00E9el des composants critiques" })] }), _jsx(CardContent, { children: healthLoading ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: [1, 2, 3].map(i => (_jsx(Skeleton, { className: "h-32" }, i))) })) : (_jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: `rounded-lg p-4 ${getStatusColor(health?.api.status || 'down')}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Server, { className: "h-5 w-5" }), _jsx("p", { className: `text-sm font-medium ${getStatusTextColor(health?.api.status || 'down')}`, children: "Serveur API" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(health?.api.status || 'down'), _jsx("span", { className: "font-semibold text-gray-900 capitalize", children: health?.api.status || 'Unknown' })] }), _jsxs("p", { className: "text-xs text-gray-600", children: ["R\u00E9ponse : ", health?.api.responseTime, "ms"] }), _jsxs("p", { className: "text-xs text-gray-600", children: ["Derni\u00E8re v\u00E9rif. : ", health?.api.lastCheck ? formatTimeAgo(new Date(health.api.lastCheck)) : 'N/A'] })] })] }), _jsxs("div", { className: `rounded-lg p-4 ${getStatusColor(health?.database.status || 'down')}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Database, { className: "h-5 w-5" }), _jsx("p", { className: `text-sm font-medium ${getStatusTextColor(health?.database.status || 'down')}`, children: "Base de donn\u00E9es" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(health?.database.status || 'down'), _jsx("span", { className: "font-semibold text-gray-900 capitalize", children: health?.database.status || 'Unknown' })] }), _jsxs("p", { className: "text-xs text-gray-600", children: ["R\u00E9ponse : ", health?.database.responseTime, "ms"] }), _jsxs("p", { className: "text-xs text-gray-600", children: ["Connexions : ", health?.database.connections || 0] })] })] }), _jsxs("div", { className: `rounded-lg p-4 ${getStatusColor(health?.gpsProviders.status || 'down')}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Wifi, { className: "h-5 w-5" }), _jsx("p", { className: `text-sm font-medium ${getStatusTextColor(health?.gpsProviders.status || 'down')}`, children: "Fournisseurs GPS" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(health?.gpsProviders.status || 'down'), _jsx("span", { className: "font-semibold text-gray-900 capitalize", children: health?.gpsProviders.status || 'Unknown' })] }), _jsxs("p", { className: "text-xs text-gray-600", children: ["Actifs : ", health?.gpsProviders.activeTrackers || 0] }), _jsxs("p", { className: "text-xs text-gray-600", children: ["Mis \u00E0 jour : ", health?.gpsProviders.lastUpdate ? formatTimeAgo(new Date(health.gpsProviders.lastUpdate)) : 'N/A'] })] })] })] })) })] }), statsLoading ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Skeleton, { className: "h-6 w-40" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-16" }), _jsx(Skeleton, { className: "h-16" })] }) })] })) : (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "h-5 w-5" }), "Performance syst\u00E8me"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-gray-200 p-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Disponibilit\u00E9" }), _jsx("p", { className: "mt-2 text-xl font-semibold text-gray-900", children: stats?.uptime ? `${(stats.uptime * 100).toFixed(2)}%` : 'N/A' })] }), _jsxs("div", { className: "rounded-lg border border-gray-200 p-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Requ\u00EAtes par seconde" }), _jsxs("p", { className: "mt-2 text-xl font-semibold text-gray-900", children: [stats?.requestsPerSecond || 0, " RPS"] })] })] }) })] }))] })), activeTab === 'organizations' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Search, { className: "h-5 w-5 text-gray-400" }), _jsx(Input, { placeholder: "Rechercher par nom ou ID...", value: searchOrg, onChange: e => setSearchOrg(e.target.value), className: "flex-1" }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Nouvelle organisation"] })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'active', 'paused', 'suspended'].map(status => (_jsx(Button, { variant: orgStatusFilter === status ? 'default' : 'outline', size: "sm", onClick: () => setOrgStatusFilter(status), children: status === 'all' ? 'Tous' : status === 'active' ? 'Actif' : status === 'paused' ? 'En pause' : 'Suspendu' }, status))) }), orgsLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => (_jsx(Skeleton, { className: "h-20" }, i))) })) : (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { children: ["Organisations (", filteredOrganizations.length, ")"] }), _jsx(CardDescription, { children: "G\u00E9rer toutes les organisations du syst\u00E8me" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: filteredOrganizations.length === 0 ? (_jsx("p", { className: "text-center text-gray-600 py-8", children: "Aucune organisation trouv\u00E9e" })) : (filteredOrganizations.map(org => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: org.name }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Plan ", org.plan, " \u2022 ", org.users, " utilisateurs \u2022 ", org.vehicles, " v\u00E9hicules"] }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Cr\u00E9\u00E9 ", formatTimeAgo(new Date(org.createdAt)), " \u2022 Derni\u00E8re activit\u00E9", ' ', formatTimeAgo(new Date(org.lastActivity))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: org.status === 'active' ? 'default' : 'secondary', className: "capitalize", children: org.status }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", children: [_jsx(Eye, { className: "h-4 w-4" }), "G\u00E9rer"] })] })] }, org.id)))) }) })] }))] })), activeTab === 'users' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Search, { className: "h-5 w-5 text-gray-400" }), _jsx(Input, { placeholder: "Rechercher par email ou nom...", value: searchUser, onChange: e => setSearchUser(e.target.value), className: "flex-1" })] }), _jsx("div", { className: "flex gap-2 flex-wrap", children: ['all', 'super_admin', 'admin', 'manager', 'operator', 'driver'].map(role => (_jsx(Button, { variant: userRoleFilter === role ? 'default' : 'outline', size: "sm", onClick: () => setUserRoleFilter(role), children: role === 'all' ? 'Tous' : role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : role === 'operator' ? 'Opérateur' : 'Conducteur' }, role))) }), usersLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3, 4, 5].map(i => (_jsx(Skeleton, { className: "h-20" }, i))) })) : (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { children: ["Utilisateurs (", filteredUsers.length, ")"] }), _jsx(CardDescription, { children: "Tous les utilisateurs et leurs d\u00E9tails" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: filteredUsers.length === 0 ? (_jsx("p", { className: "text-center text-gray-600 py-8", children: "Aucun utilisateur trouv\u00E9" })) : (filteredUsers.map(user => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: user.name }), _jsx("p", { className: "text-sm text-gray-600", children: user.email }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [user.organizationName, " \u2022 ", user.role, " \u2022 Inscrit", ' ', formatTimeAgo(new Date(user.createdAt))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: user.status === 'active' ? 'default' : 'secondary', className: "capitalize", children: user.status }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", children: [_jsx(Eye, { className: "h-4 w-4" }), "Voir"] })] })] }, user.id)))) }) })] }))] })), activeTab === 'config' && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "h-5 w-5" }), "Configuration syst\u00E8me"] }), _jsx(CardDescription, { children: "Configurez les param\u00E8tres syst\u00E8me globaux" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 mb-2", children: "Intervalle max. de mise \u00E0 jour GPS" }), _jsx(Input, { type: "number", placeholder: "30", defaultValue: "30" }), _jsx("p", { className: "text-xs text-gray-600 mt-1", children: "en secondes" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 mb-2", children: "P\u00E9riode de conservation des alertes" }), _jsx(Input, { type: "number", placeholder: "30", defaultValue: "30" }), _jsx("p", { className: "text-xs text-gray-600 mt-1", children: "en jours" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 mb-2", children: "Connexions simultan\u00E9es max." }), _jsx(Input, { type: "number", placeholder: "1000", defaultValue: "1000" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 mb-2", children: "Fr\u00E9quence des notifications email" }), _jsxs("select", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm", children: [_jsx("option", { children: "Imm\u00E9diat" }), _jsx("option", { children: "R\u00E9sum\u00E9 horaire" }), _jsx("option", { children: "R\u00E9sum\u00E9 quotidien" }), _jsx("option", { children: "D\u00E9sactiv\u00E9" })] })] })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-4", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Fonctionnalit\u00E9s" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "rounded", defaultChecked: true }), _jsx("span", { className: "text-sm text-gray-700", children: "Suivi GPS en temps r\u00E9el" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "rounded", defaultChecked: true }), _jsx("span", { className: "text-sm text-gray-700", children: "Alertes automatis\u00E9es" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "rounded", defaultChecked: true }), _jsx("span", { className: "text-sm text-gray-700", children: "Analyses avanc\u00E9es" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "rounded" }), _jsx("span", { className: "text-sm text-gray-700", children: "Mode maintenance" })] })] })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsxs(Button, { className: "gap-2", children: [_jsx(Settings, { className: "h-4 w-4" }), "Enregistrer la configuration"] }), _jsx(Button, { variant: "outline", children: "R\u00E9initialiser" })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Maintenance syst\u00E8me" }), _jsx(CardDescription, { children: "Effectuer des t\u00E2ches de maintenance syst\u00E8me" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { variant: "outline", className: "w-full justify-start", children: "Vider le cache" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", children: "Reconstruire l'index de recherche" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", children: "Archiver les anciennes donn\u00E9es" }), _jsx(Button, { variant: "outline", className: "w-full justify-start text-red-600 hover:bg-red-50", children: "Red\u00E9marrer les services" })] }) })] })] }))] }));
}
//# sourceMappingURL=SuperAdminPage.js.map