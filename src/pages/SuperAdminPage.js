'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Users, Building2, BarChart3, Activity, Shield, Server, Database, Wifi, RefreshCw, Search, Eye, Plus, AlertTriangle, CheckCircle, Clock, Download, Upload, Power, HardDrive, AlertCircle, Info, TrendingUp, Headphones, Palette, Radio, Send, Circle, AlertOctagon, Zap, } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/utils';
// Mock error logs data
const mockErrors = [
    { time: '14:32', level: 'error', message: 'Connexion GPS perdue — Flespi channel #4521', count: 3 },
    { time: '13:15', level: 'warning', message: 'Temps de réponse API > 2s', count: 12 },
    { time: '12:01', level: 'info', message: 'Sauvegarde automatique terminée', count: 1 },
    { time: '10:45', level: 'error', message: 'Échec synchronisation Echoes', count: 5 },
];
// Mock GPS provider health data
const gpsProviderHealth = [
    { name: 'Flespi', status: 'connected', latency: 45 },
    { name: 'Echoes', status: 'connected', latency: 120 },
    { name: 'KeepTrace', status: 'connected', latency: 89 },
    { name: 'Ubiwan', status: 'connected', latency: 95 },
];
// Mock revenue data
const mockRevenueData = [
    { month: 'Jan', revenue: 12500 },
    { month: 'Fév', revenue: 15800 },
    { month: 'Mar', revenue: 18200 },
    { month: 'Avr', revenue: 21500 },
    { month: 'Mai', revenue: 19800 },
    { month: 'Juin', revenue: 24300 },
    { month: 'Juil', revenue: 28500 },
    { month: 'Aoû', revenue: 31200 },
    { month: 'Sep', revenue: 29800 },
    { month: 'Oct', revenue: 35600 },
    { month: 'Nov', revenue: 38900 },
    { month: 'Déc', revenue: 42100 },
];
// Mock support tickets
const mockSupportTickets = [
    {
        id: 'TK-001',
        organizationId: 'org-1',
        organizationName: 'TechCorp Solutions',
        subject: 'Intégration GPS Flespi ne fonctionne pas',
        status: 'ouvert',
        priority: 'haute',
        createdAt: '2026-04-01T10:30:00Z',
        lastUpdate: '2026-04-01T10:30:00Z',
    },
    {
        id: 'TK-002',
        organizationId: 'org-2',
        organizationName: 'GlobalTech Inc',
        subject: 'Demande d\'accès API pour développement',
        status: 'en cours',
        priority: 'normale',
        createdAt: '2026-03-31T14:15:00Z',
        assignedTo: 'support@fleet-tracker.com',
        lastUpdate: '2026-03-31T16:45:00Z',
    },
    {
        id: 'TK-003',
        organizationId: 'org-3',
        organizationName: 'MobileFleet Tracking',
        subject: 'Mise à jour du plan facturation',
        status: 'résolu',
        priority: 'normale',
        createdAt: '2026-03-28T09:00:00Z',
        assignedTo: 'billing@fleet-tracker.com',
        lastUpdate: '2026-03-30T12:00:00Z',
    },
    {
        id: 'TK-004',
        organizationId: 'org-4',
        organizationName: 'CityLogistics Ltd',
        subject: 'Alertes géofence ne se déclenchent pas',
        status: 'en cours',
        priority: 'critique',
        createdAt: '2026-04-01T08:20:00Z',
        assignedTo: 'support@fleet-tracker.com',
        lastUpdate: '2026-04-01T11:15:00Z',
    },
];
// Mock trackers
const mockTrackers = [
    {
        id: 'ECH-001',
        name: 'Tracker #12345',
        status: 'online',
        lastCommunication: '2026-04-01T12:15:00Z',
        organizationId: 'org-1',
        organizationName: 'TechCorp Solutions',
    },
    {
        id: 'ECH-002',
        name: 'Tracker #12346',
        status: 'online',
        lastCommunication: '2026-04-01T12:10:00Z',
        organizationId: 'org-1',
        organizationName: 'TechCorp Solutions',
    },
    {
        id: 'ECH-003',
        name: 'Tracker #12347',
        status: 'offline',
        lastCommunication: '2026-04-01T08:30:00Z',
        organizationId: 'org-2',
        organizationName: 'GlobalTech Inc',
    },
    {
        id: 'ECH-004',
        name: 'Tracker #12348',
        status: 'maintenance',
        lastCommunication: '2026-03-31T16:45:00Z',
        organizationId: 'org-3',
        organizationName: 'MobileFleet Tracking',
    },
];
// Mock billing records
const mockBillingRecords = [
    {
        id: 'BIL-001',
        date: '2026-04-01',
        amount: 299,
        status: 'payée',
        description: 'Plan Pro - Avril 2026',
    },
    {
        id: 'BIL-002',
        date: '2026-03-01',
        amount: 299,
        status: 'payée',
        description: 'Plan Pro - Mars 2026',
    },
    {
        id: 'BIL-003',
        date: '2026-02-01',
        amount: 199,
        status: 'payée',
        description: 'Plan Starter - Février 2026',
    },
    {
        id: 'BIL-004',
        date: '2026-01-01',
        amount: 199,
        status: 'payée',
        description: 'Plan Starter - Janvier 2026',
    },
];
export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchOrg, setSearchOrg] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [orgStatusFilter, setOrgStatusFilter] = useState('all');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [suspendedOrgs, setSuspendedOrgs] = useState(new Set());
    const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketReply, setTicketReply] = useState('');
    const [selectedOrgForBilling, setSelectedOrgForBilling] = useState('org-1');
    const [whitelabelOrg, setWhitelabelOrg] = useState('org-1');
    const [trackerStatusFilter, setTrackerStatusFilter] = useState('all');
    // Organization CRUD states
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [orgFormData, setOrgFormData] = useState({ name: '', plan: 'Starter', settings: '' });
    const [orgToDelete, setOrgToDelete] = useState(null);
    // User CRUD states
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({ name: '', email: '', role: 'operator', organizationId: '' });
    const [userToDelete, setUserToDelete] = useState(null);
    // Revenue and Billing data
    const [revenueData, setRevenueData] = useState(mockRevenueData);
    const [billingData, setBillingData] = useState(mockBillingRecords);
    // Config state
    const [configData, setConfigData] = useState({
        gpsUpdateInterval: 30,
        dataRetentionDays: 30,
        maxVehiclesPerOrg: 1000,
        enableRegistration: true,
    });
    // Fetch system health
    const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
        queryKey: ['super-admin-health'],
        queryFn: async () => {
            try {
                const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_HEALTH || '/api/super-admin/health');
                return (response.data || null);
            }
            catch {
                return null;
            }
        },
        refetchInterval: 30000,
        retry: false,
    });
    // Fetch system stats
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['super-admin-stats'],
        queryFn: async () => {
            try {
                const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_STATS || '/api/super-admin/stats');
                return (response.data || null);
            }
            catch {
                return null;
            }
        },
        refetchInterval: 60000,
        retry: false,
    });
    // Fetch organizations
    const { data: organizations = [], isLoading: orgsLoading, refetch: refetchOrgs } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            try {
                const response = await apiClient.get(API_ROUTES.ORGANIZATIONS || '/api/organizations');
                const raw = response.data;
                if (Array.isArray(raw))
                    return raw;
                if (raw && Array.isArray(raw.data))
                    return raw.data;
                return [];
            }
            catch {
                return [];
            }
        },
        retry: false,
    });
    // Fetch users
    const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['super-admin-users'],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/api/super-admin/users');
                const raw = response.data;
                if (Array.isArray(raw))
                    return raw;
                if (raw && Array.isArray(raw.data))
                    return raw.data;
                return [];
            }
            catch {
                return [];
            }
        },
        retry: false,
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
    // Organization CRUD handlers
    const openOrgModal = (org) => {
        if (org) {
            setEditingOrg(org);
            setOrgFormData({ name: org.name, plan: org.plan, settings: '' });
        }
        else {
            setEditingOrg(null);
            setOrgFormData({ name: '', plan: 'Starter', settings: '' });
        }
        setShowOrgModal(true);
    };
    const closeOrgModal = () => {
        setShowOrgModal(false);
        setEditingOrg(null);
        setOrgFormData({ name: '', plan: 'Starter', settings: '' });
    };
    const saveOrganization = async () => {
        try {
            if (editingOrg) {
                await apiClient.put(`/api/organizations/${editingOrg.id}`, orgFormData);
            }
            else {
                await apiClient.post('/api/organizations', orgFormData);
            }
            refetchOrgs();
            closeOrgModal();
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'organisation:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };
    const deleteOrganization = async (orgId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette organisation ?')) {
            try {
                await apiClient.delete(`/api/organizations/${orgId}`);
                refetchOrgs();
                setOrgToDelete(null);
            }
            catch (error) {
                console.error('Erreur lors de la suppression de l\'organisation:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };
    // User CRUD handlers
    const openUserModal = (user) => {
        if (user) {
            setEditingUser(user);
            setUserFormData({ name: user.name, email: user.email, role: user.role, organizationId: user.organizationId });
        }
        else {
            setEditingUser(null);
            setUserFormData({ name: '', email: '', role: 'operator', organizationId: organizations[0]?.id || '' });
        }
        setShowUserModal(true);
    };
    const closeUserModal = () => {
        setShowUserModal(false);
        setEditingUser(null);
        setUserFormData({ name: '', email: '', role: 'operator', organizationId: '' });
    };
    const saveUser = async () => {
        try {
            if (editingUser) {
                await apiClient.put(`/api/super-admin/users/${editingUser.id}`, userFormData);
            }
            else {
                await apiClient.post('/api/super-admin/users', userFormData);
            }
            refetchUsers();
            closeUserModal();
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };
    const deleteUser = async (userId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await apiClient.delete(`/api/super-admin/users/${userId}`);
                refetchUsers();
                setUserToDelete(null);
            }
            catch (error) {
                console.error('Erreur lors de la suppression de l\'utilisateur:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };
    // Revenue data handler
    const fetchRevenueData = async () => {
        try {
            const response = await apiClient.get('/api/super-admin/revenue');
            const data = response.data || mockRevenueData;
            setRevenueData(Array.isArray(data) ? data : mockRevenueData);
        }
        catch (error) {
            console.error('Erreur lors de la récupération des revenus:', error);
            setRevenueData(mockRevenueData);
        }
    };
    // Billing data handler
    const fetchBillingData = async () => {
        try {
            const response = await apiClient.get('/api/super-admin/billing');
            const data = response.data || mockBillingRecords;
            setBillingData(Array.isArray(data) ? data : mockBillingRecords);
        }
        catch (error) {
            console.error('Erreur lors de la récupération de la facturation:', error);
            setBillingData(mockBillingRecords);
        }
    };
    // Config save handler
    const saveSystemConfig = async () => {
        try {
            await apiClient.post('/api/super-admin/config', configData);
            alert('Configuration système enregistrée');
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
            alert('Erreur lors de la sauvegarde de la configuration');
        }
    };
    // Support ticket handlers
    const closeTicket = async () => {
        if (!selectedTicket)
            return;
        try {
            await apiClient.put(`/api/super-admin/tickets/${selectedTicket.id}`, { status: 'résolu' });
            setSelectedTicket(null);
        }
        catch (error) {
            console.error('Erreur lors de la fermeture du ticket:', error);
        }
    };
    const submitTicketReply = async () => {
        if (!selectedTicket || !ticketReply.trim())
            return;
        try {
            await apiClient.post(`/api/super-admin/tickets/${selectedTicket.id}/reply`, { message: ticketReply });
            setTicketReply('');
            // Refresh ticket details
            setSelectedTicket(null);
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de la réponse:', error);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'operational':
            case 'connected':
            case 'active':
                return 'bg-[#12121A]';
            case 'degraded':
                return 'bg-yellow-50';
            case 'down':
            case 'disconnected':
            case 'suspended':
                return 'bg-[#12121A]';
            default:
                return 'bg-[#12121A]';
        }
    };
    const getStatusTextColor = (status) => {
        switch (status) {
            case 'operational':
            case 'connected':
            case 'active':
                return 'text-[#00E5CC]';
            case 'degraded':
                return 'text-yellow-600';
            case 'down':
            case 'disconnected':
            case 'suspended':
                return 'text-[#FF4D6A]';
            default:
                return 'text-[#6B6B80]';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'operational':
            case 'connected':
            case 'active':
                return _jsx(CheckCircle, { className: "h-5 w-5 text-[#00E5CC]" });
            case 'degraded':
                return _jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-600" });
            case 'down':
            case 'disconnected':
            case 'suspended':
                return _jsx(AlertTriangle, { className: "h-5 w-5 text-[#FF4D6A]" });
            default:
                return _jsx(Clock, { className: "h-5 w-5 text-[#6B6B80]" });
        }
    };
    const toggleOrgSuspend = (orgId) => {
        setSuspendedOrgs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orgId)) {
                newSet.delete(orgId);
            }
            else {
                newSet.add(orgId);
            }
            return newSet;
        });
    };
    const handleImportTrackers = () => {
        alert('Fonctionnalité en cours de développement');
    };
    const handleExportTrackers = () => {
        alert('Fonctionnalité en cours de développement');
    };
    const handleImportPlatform = () => {
        alert('Fonctionnalité en cours de développement');
    };
    const handleSyncMetadata = () => {
        alert('Fonctionnalité en cours de développement');
    };
    const handleBackup = () => {
        alert('Fonctionnalité en cours de développement');
    };
    const handleRestore = () => {
        alert('Fonctionnalité en cours de développement');
    };
    const getErrorLevelColor = (level) => {
        switch (level) {
            case 'error':
                return 'bg-[#1A1A25] text-[#FF4D6A]';
            case 'warning':
                return 'bg-yellow-100 text-yellow-900';
            case 'info':
                return 'bg-[#1A1A25] text-[#00E5CC]';
            default:
                return 'bg-[#0A0A0F] text-[#F0F0F5]';
        }
    };
    const getErrorLevelDot = (level) => {
        switch (level) {
            case 'error':
                return _jsx("div", { className: "h-3 w-3 rounded-full bg-[#FF4D6A]" });
            case 'warning':
                return _jsx("div", { className: "h-3 w-3 rounded-full bg-yellow-600" });
            case 'info':
                return _jsx("div", { className: "h-3 w-3 rounded-full bg-[#00E5CC]" });
            default:
                return _jsx("div", { className: "h-3 w-3 rounded-full bg-[#1A1A25]" });
        }
    };
    return (_jsxs("div", { className: "space-y-6 bg-[#0A0A0F] min-h-screen p-6", children: [_jsxs("div", { className: "flex items-start justify-between rounded-lg border-l-4 border-[#FF4D6A] bg-[#12121A] p-4 border border-[#1F1F2E]", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Administration syst\u00E8me" }), _jsx("p", { className: "mt-2 text-[#6B6B80]", children: "Super admin uniquement \u2014 gestion de toutes les organisations et utilisateurs" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefreshAll, className: "gap-2", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Actualiser"] })] }), _jsx("div", { className: "flex gap-2 border-b border-[#1F1F2E] overflow-x-auto", children: ['overview', 'organizations', 'users', 'revenue', 'support', 'billing', 'whitelabel', 'echoes', 'config'].map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                        ? 'border-[#00E5CC] text-[#00E5CC]'
                        : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: [tab === 'overview' && 'Vue d\'ensemble', tab === 'organizations' && 'Organisations', tab === 'users' && 'Utilisateurs', tab === 'revenue' && 'Revenus', tab === 'support' && 'Support', tab === 'billing' && 'Facturation', tab === 'whitelabel' && 'White Label', tab === 'echoes' && 'Echoes', tab === 'config' && 'Configuration'] }, tab))) }), activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-5", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Utilisateurs totaux" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-[#F0F0F5]", children: stats?.totalUsers || 0 })] }), _jsx(Users, { className: "h-8 w-8 text-[#00E5CC] opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Organisations" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-[#F0F0F5]", children: stats?.totalOrganizations || 0 })] }), _jsx(Building2, { className: "h-8 w-8 text-[#00E5CC] opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "V\u00E9hicules totaux" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-[#F0F0F5]", children: stats?.totalVehicles || 0 })] }), _jsx(BarChart3, { className: "h-8 w-8 text-purple-600 opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Traceurs actifs" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-[#F0F0F5]", children: stats?.activeTrackers || 0 })] }), _jsx(Activity, { className: "h-8 w-8 text-orange-600 opacity-20" })] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: statsLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-20 mb-2" }), _jsx(Skeleton, { className: "h-8 w-16" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Alertes actives" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-[#F0F0F5]", children: stats?.activeAlerts || 0 })] }), _jsx(AlertTriangle, { className: "h-8 w-8 text-[#FF4D6A] opacity-20" })] }) })) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Wifi, { className: "h-5 w-5" }), "V\u00E9rifications sant\u00E9 connexion"] }), _jsx(CardDescription, { children: "\u00C9tat de connexion des fournisseurs GPS" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: gpsProviderHealth.map(provider => (_jsx("div", { className: "flex items-center justify-between rounded-lg border border-[#1F1F2E] p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [provider.status === 'connected' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-3 w-3 rounded-full bg-[#00E5CC]" }), _jsx("span", { className: "text-sm font-medium text-[#F0F0F5]", children: provider.name }), _jsxs("span", { className: "text-xs text-[#00E5CC]", children: ["Connect\u00E9 \u2014 ", provider.latency, "ms"] })] })), provider.status === 'degraded' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-3 w-3 rounded-full bg-yellow-600" }), _jsx("span", { className: "text-sm font-medium text-[#F0F0F5]", children: provider.name }), _jsxs("span", { className: "text-xs text-yellow-600", children: ["Latence \u00E9lev\u00E9e \u2014 ", provider.latency, "ms"] })] })), provider.status === 'disconnected' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-3 w-3 rounded-full bg-[#FF4D6A]" }), _jsx("span", { className: "text-sm font-medium text-[#F0F0F5]", children: provider.name }), _jsx("span", { className: "text-xs text-[#FF4D6A]", children: "D\u00E9connect\u00E9" })] }))] }) }, provider.name))) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5" }), "Sant\u00E9 du syst\u00E8me"] }), _jsx(CardDescription, { children: "\u00C9tat en temps r\u00E9el des composants critiques" })] }), _jsx(CardContent, { children: healthLoading ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: [1, 2, 3].map(i => (_jsx(Skeleton, { className: "h-32" }, i))) })) : (_jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: `rounded-lg p-4 ${getStatusColor(health?.api?.status || 'down')}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Server, { className: "h-5 w-5" }), _jsx("p", { className: `text-sm font-medium ${getStatusTextColor(health?.api?.status || 'down')}`, children: "Serveur API" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(health?.api?.status || 'down'), _jsx("span", { className: "font-semibold text-[#F0F0F5] capitalize", children: health?.api?.status || 'Unknown' })] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["R\u00E9ponse : ", health?.api?.responseTime, "ms"] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["Derni\u00E8re v\u00E9rif. : ", health?.api?.lastCheck ? formatTimeAgo(new Date(health.api.lastCheck)) : 'N/A'] })] })] }), _jsxs("div", { className: `rounded-lg p-4 ${getStatusColor(health?.database?.status || 'down')}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Database, { className: "h-5 w-5" }), _jsx("p", { className: `text-sm font-medium ${getStatusTextColor(health?.database?.status || 'down')}`, children: "Base de donn\u00E9es" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(health?.database?.status || 'down'), _jsx("span", { className: "font-semibold text-[#F0F0F5] capitalize", children: health?.database?.status || 'Unknown' })] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["R\u00E9ponse : ", health?.database?.responseTime, "ms"] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["Connexions : ", health?.database?.connections || 0] })] })] }), _jsxs("div", { className: `rounded-lg p-4 ${getStatusColor(health?.gpsProviders?.status || 'down')}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Wifi, { className: "h-5 w-5" }), _jsx("p", { className: `text-sm font-medium ${getStatusTextColor(health?.gpsProviders?.status || 'down')}`, children: "Fournisseurs GPS" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(health?.gpsProviders?.status || 'down'), _jsx("span", { className: "font-semibold text-[#F0F0F5] capitalize", children: health?.gpsProviders?.status || 'Unknown' })] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["Actifs : ", health?.gpsProviders?.activeTrackers || 0] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["Mis \u00E0 jour : ", health?.gpsProviders?.lastUpdate ? formatTimeAgo(new Date(health.gpsProviders.lastUpdate)) : 'N/A'] })] })] })] })) })] }), statsLoading ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Skeleton, { className: "h-6 w-40" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-16" }), _jsx(Skeleton, { className: "h-16" })] }) })] })) : (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "h-5 w-5" }), "Performance syst\u00E8me"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Disponibilit\u00E9" }), _jsx("p", { className: "mt-2 text-xl font-semibold text-[#F0F0F5]", children: stats?.uptime ? `${(stats.uptime * 100).toFixed(2)}%` : 'N/A' })] }), _jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Requ\u00EAtes par seconde" }), _jsxs("p", { className: "mt-2 text-xl font-semibold text-[#F0F0F5]", children: [stats?.requestsPerSecond || 0, " RPS"] })] })] }) })] }))] })), activeTab === 'organizations' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Search, { className: "h-5 w-5 text-[#44445A]" }), _jsx(Input, { placeholder: "Rechercher par nom ou ID...", value: searchOrg, onChange: e => setSearchOrg(e.target.value), className: "flex-1" }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", onClick: () => openOrgModal(), children: [_jsx(Plus, { className: "h-4 w-4" }), "Cr\u00E9er une organisation"] })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'active', 'paused', 'suspended'].map(status => (_jsx(Button, { variant: orgStatusFilter === status ? 'default' : 'outline', size: "sm", onClick: () => setOrgStatusFilter(status), children: status === 'all' ? 'Tous' : status === 'active' ? 'Actif' : status === 'paused' ? 'En pause' : 'Suspendu' }, status))) }), orgsLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => (_jsx(Skeleton, { className: "h-20" }, i))) })) : (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { children: ["Organisations (", filteredOrganizations.length, ")"] }), _jsx(CardDescription, { children: "G\u00E9rer toutes les organisations du syst\u00E8me" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: filteredOrganizations.length === 0 ? (_jsx("p", { className: "text-center text-[#6B6B80] py-8", children: "Aucune organisation trouv\u00E9e" })) : (filteredOrganizations.map(org => {
                                        const isSuspended = suspendedOrgs.has(org.id);
                                        return (_jsxs("div", { className: "flex flex-col rounded-lg border border-[#1F1F2E] p-4 hover:border-[#1F1F2E] transition-colors space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: org.name }), _jsxs("p", { className: "text-sm text-[#6B6B80] mt-1", children: [org.users, " utilisateurs \u2022 ", org.vehicles, " v\u00E9hicules"] }), _jsxs("p", { className: "text-xs text-[#6B6B80] mt-1", children: ["Cr\u00E9\u00E9 ", formatTimeAgo(new Date(org.createdAt)), " \u2022 Derni\u00E8re activit\u00E9", ' ', formatTimeAgo(new Date(org.lastActivity))] })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { variant: org.plan === 'Pro' || org.plan === 'Enterprise' ? 'default' : 'secondary', className: "capitalize", children: org.plan }) })] }), _jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-[#1F1F2E]", children: [_jsx("div", { className: "flex-1", children: _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["Facturation : ", org.plan, " \u2014 Prochaine \u00E9ch\u00E9ance : 01/05/2026"] }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: isSuspended ? 'default' : 'outline', size: "sm", onClick: () => toggleOrgSuspend(org.id), className: isSuspended ? 'gap-1' : 'gap-1', children: isSuspended ? (_jsxs(_Fragment, { children: [_jsx(Power, { className: "h-4 w-4" }), "Activer"] })) : (_jsxs(_Fragment, { children: [_jsx(Power, { className: "h-4 w-4" }), "Suspendre"] })) }), _jsx(Badge, { variant: org.status === 'active' && !isSuspended ? 'default' : 'secondary', className: "capitalize", children: isSuspended ? 'Suspendu' : org.status }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", onClick: () => openOrgModal(org), children: [_jsx(Eye, { className: "h-4 w-4" }), "\u00C9diter"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1 text-[#FF4D6A] hover:bg-[#12121A]", onClick: () => deleteOrganization(org.id), children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), "Supprimer"] })] })] })] }, org.id));
                                    })) }) })] }))] })), activeTab === 'users' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Search, { className: "h-5 w-5 text-[#44445A]" }), _jsx(Input, { placeholder: "Rechercher par email ou nom...", value: searchUser, onChange: e => setSearchUser(e.target.value), className: "flex-1" }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", onClick: () => openUserModal(), children: [_jsx(Plus, { className: "h-4 w-4" }), "Cr\u00E9er un utilisateur"] })] }), _jsx("div", { className: "flex gap-2 flex-wrap", children: ['all', 'super_admin', 'admin', 'manager', 'operator', 'driver'].map(role => (_jsx(Button, { variant: userRoleFilter === role ? 'default' : 'outline', size: "sm", onClick: () => setUserRoleFilter(role), children: role === 'all' ? 'Tous' : role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : role === 'operator' ? 'Opérateur' : 'Conducteur' }, role))) }), usersLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3, 4, 5].map(i => (_jsx(Skeleton, { className: "h-20" }, i))) })) : (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { children: ["Utilisateurs (", filteredUsers.length, ")"] }), _jsx(CardDescription, { children: "Tous les utilisateurs et leurs d\u00E9tails" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: filteredUsers.length === 0 ? (_jsx("p", { className: "text-center text-[#6B6B80] py-8", children: "Aucun utilisateur trouv\u00E9" })) : (filteredUsers.map(user => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1F1F2E] p-4 hover:border-[#1F1F2E] transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: user.name }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: user.email }), _jsxs("p", { className: "text-xs text-[#6B6B80] mt-1", children: [user.organizationName, " \u2022 ", user.role, " \u2022 Inscrit", ' ', formatTimeAgo(new Date(user.createdAt))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: user.status === 'active' ? 'default' : 'secondary', className: "capitalize", children: user.status }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", onClick: () => openUserModal(user), children: [_jsx(Eye, { className: "h-4 w-4" }), "\u00C9diter"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1 text-[#FF4D6A] hover:bg-[#12121A]", onClick: () => deleteUser(user.id), children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), "Supprimer"] })] })] }, user.id)))) }) })] }))] })), activeTab === 'config' && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "h-5 w-5" }), "Configuration syst\u00E8me"] }), _jsx(CardDescription, { children: "Configurez les param\u00E8tres syst\u00E8me globaux" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Intervalle max. de mise \u00E0 jour GPS" }), _jsx(Input, { type: "number", value: configData.gpsUpdateInterval, onChange: e => setConfigData({ ...configData, gpsUpdateInterval: parseInt(e.target.value) }) }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: "en secondes" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "P\u00E9riode de conservation des donn\u00E9es" }), _jsx(Input, { type: "number", value: configData.dataRetentionDays, onChange: e => setConfigData({ ...configData, dataRetentionDays: parseInt(e.target.value) }) }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: "en jours" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "V\u00E9hicules max. par organisation" }), _jsx(Input, { type: "number", value: configData.maxVehiclesPerOrg, onChange: e => setConfigData({ ...configData, maxVehiclesPerOrg: parseInt(e.target.value) }) })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: configData.enableRegistration, onChange: e => setConfigData({ ...configData, enableRegistration: e.target.checked }), className: "rounded" }), _jsx("span", { className: "text-sm text-[#F0F0F5]", children: "Activer les nouvelles inscriptions" })] }) })] }), _jsxs("div", { className: "rounded-lg bg-[#12121A] p-4 border border-[#1F1F2E]", children: [_jsx("h4", { className: "font-medium text-[#F0F0F5] mb-3", children: "\u00C0 propos" }), _jsx("p", { className: "text-sm text-[#F0F0F5]", children: "Ces param\u00E8tres affectent le comportement global du syst\u00E8me pour toutes les organisations." })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsxs(Button, { className: "gap-2", onClick: saveSystemConfig, children: [_jsx(Settings, { className: "h-4 w-4" }), "Enregistrer la configuration"] }), _jsx(Button, { variant: "outline", onClick: () => setConfigData({
                                                        gpsUpdateInterval: 30,
                                                        dataRetentionDays: 30,
                                                        maxVehiclesPerOrg: 1000,
                                                        enableRegistration: true,
                                                    }), children: "R\u00E9initialiser" })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Download, { className: "h-5 w-5" }), "Import / Export"] }), _jsx(CardDescription, { children: "G\u00E9rer les traceurs via import/export CSV" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsxs(Button, { variant: "outline", className: "gap-2 justify-start", onClick: handleImportTrackers, children: [_jsx(Upload, { className: "h-4 w-4" }), "Importer des trackers (CSV)"] }), _jsxs(Button, { variant: "outline", className: "gap-2 justify-start", onClick: handleExportTrackers, children: [_jsx(Download, { className: "h-4 w-4" }), "Exporter tous les trackers (CSV)"] }), _jsxs(Button, { variant: "outline", className: "gap-2 justify-start", onClick: handleImportPlatform, children: [_jsx(Upload, { className: "h-4 w-4" }), "Importer depuis une plateforme"] }), _jsxs(Button, { variant: "outline", className: "gap-2 justify-start", onClick: handleSyncMetadata, children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Synchroniser les m\u00E9tadonn\u00E9es"] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "h-5 w-5" }), "Journaux d'erreurs"] }), _jsx(CardDescription, { children: "Erreurs et avertissements r\u00E9cents du syst\u00E8me" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-2", children: mockErrors.map((error, idx) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1F1F2E] p-3 hover:bg-[#12121A] transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [getErrorLevelDot(error.level), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-[#6B6B80]", children: error.time }), _jsx("p", { className: "text-sm text-[#F0F0F5] truncate", children: error.message })] })] }), _jsx(Badge, { variant: "outline", className: "ml-2", children: error.count })] }, idx))) }), _jsx(Button, { variant: "link", className: "w-full mt-4 justify-center text-[#00E5CC] hover:text-[#00E5CC]", children: "Voir tous les journaux" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(HardDrive, { className: "h-5 w-5" }), "Sauvegarde et restauration"] }), _jsx(CardDescription, { children: "G\u00E9rer les sauvegardes du syst\u00E8me" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "rounded-lg border border-[#1F1F2E] p-4 bg-[#12121A]", children: _jsxs("p", { className: "text-sm text-[#F0F0F5]", children: [_jsx("span", { className: "font-medium", children: "Derni\u00E8re sauvegarde :" }), " il y a 6 heures"] }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { variant: "outline", className: "w-full gap-2", onClick: handleBackup, children: [_jsx(HardDrive, { className: "h-4 w-4" }), "Lancer une sauvegarde"] }), _jsxs(Button, { variant: "outline", className: "w-full gap-2 text-[#FF4D6A] hover:bg-[#12121A] hover:text-[#FF4D6A]", onClick: handleRestore, children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), "Restaurer depuis une sauvegarde"] })] }), _jsx("div", { className: "rounded-lg bg-[#12121A] p-3 border border-[#1F1F2E]", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Info, { className: "h-4 w-4 text-[#00E5CC]" }), _jsx("p", { className: "text-xs text-[#00E5CC]", children: "Op\u00E9ration: 0% - Estimation: 5 minutes" })] }) })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Maintenance syst\u00E8me" }), _jsx(CardDescription, { children: "Effectuer des t\u00E2ches de maintenance syst\u00E8me" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { variant: "outline", className: "w-full justify-start", children: "Vider le cache" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", children: "Reconstruire l'index de recherche" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", children: "Archiver les anciennes donn\u00E9es" }), _jsx(Button, { variant: "outline", className: "w-full justify-start text-[#FF4D6A] hover:bg-[#12121A]", children: "Red\u00E9marrer les services" })] }) })] })] })), activeTab === 'revenue' && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-5 w-5" }), "Revenus mensuels"] }), _jsx(CardDescription, { children: "Tendance des revenus sur les 12 derniers mois" }), _jsxs(Button, { variant: "link", size: "sm", onClick: fetchRevenueData, className: "mt-2 gap-1", children: [_jsx(RefreshCw, { className: "h-3 w-3" }), "Actualiser"] })] }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: revenueData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorRevenue", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0.1 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "month", stroke: "#6b7280" }), _jsx(YAxis, { stroke: "#6b7280" }), _jsx(Tooltip, { contentStyle: {
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                }, formatter: (value) => `€${Number(value).toLocaleString()}` }), _jsx(Area, { type: "monotone", dataKey: "revenue", stroke: "#3b82f6", fillOpacity: 1, fill: "url(#colorRevenue)" })] }) }) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Revenu annuel (ARR)" }), _jsx("p", { className: "text-3xl font-bold text-[#F0F0F5]", children: "\u20AC342.2K" }), _jsx("p", { className: "text-xs text-[#00E5CC] font-medium", children: "+12% vs ann\u00E9e pr\u00E9c\u00E9dente" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Revenu mensuel r\u00E9current" }), _jsx("p", { className: "text-3xl font-bold text-[#F0F0F5]", children: "\u20AC28.5K" }), _jsx("p", { className: "text-xs text-[#00E5CC] font-medium", children: "+18% vs mois dernier" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Taux de croissance" }), _jsx("p", { className: "text-3xl font-bold text-[#F0F0F5]", children: "+3.2%" }), _jsx("p", { className: "text-xs text-[#6B6B80] font-medium", children: "Croissance mensuelle" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Organisations actives" }), _jsx("p", { className: "text-3xl font-bold text-[#F0F0F5]", children: organizations.length }), _jsx("p", { className: "text-xs text-[#6B6B80] font-medium", children: "Avec facturation active" })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Revenu par organisation" }), _jsx(CardDescription, { children: "D\u00E9tail du revenu et du plan par organisation" })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E]", children: [_jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "Organisation" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "Plan" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "Revenu mensuel" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "\u00C9tat" })] }) }), _jsx("tbody", { children: organizations.slice(0, 5).map(org => {
                                                    const monthlyRevenue = org.plan === 'Enterprise' ? 1299 : org.plan === 'Pro' ? 299 : 99;
                                                    return (_jsxs("tr", { className: "border-b border-[#1F1F2E] hover:bg-[#12121A]", children: [_jsx("td", { className: "py-3 px-4", children: org.name }), _jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: "outline", children: org.plan }) }), _jsxs("td", { className: "py-3 px-4 font-medium", children: ["\u20AC", monthlyRevenue] }), _jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: org.status === 'active' ? 'default' : 'secondary', className: "capitalize", children: org.status === 'active' ? 'Actif' : org.status === 'paused' ? 'En pause' : 'Suspendu' }) })] }, org.id));
                                                }) })] }) }) })] })] })), activeTab === 'support' && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex gap-2", children: ['all', 'ouvert', 'en cours', 'résolu'].map(status => (_jsx(Button, { variant: ticketStatusFilter === status ? 'default' : 'outline', size: "sm", onClick: () => setTicketStatusFilter(status), children: status === 'all' ? 'Tous' : status === 'ouvert' ? 'Ouvert' : status === 'en cours' ? 'En cours' : 'Résolu' }, status))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Headphones, { className: "h-5 w-5" }), "Tickets (", mockSupportTickets.length, ")"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: mockSupportTickets
                                                    .filter(t => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
                                                    .map(ticket => (_jsx("button", { onClick: () => setSelectedTicket(ticket), className: `w-full text-left p-3 rounded-lg border transition-colors ${selectedTicket?.id === ticket.id
                                                        ? 'border-blue-500 bg-[#12121A]'
                                                        : 'border-[#1F1F2E] hover:border-[#1F1F2E]'}`, children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-xs font-medium text-[#6B6B80]", children: ticket.id }), _jsx("p", { className: "text-sm font-medium text-[#F0F0F5] truncate", children: ticket.subject }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: ticket.organizationName })] }), _jsx(Badge, { variant: ticket.priority === 'critique'
                                                                    ? 'destructive'
                                                                    : ticket.priority === 'haute'
                                                                        ? 'secondary'
                                                                        : 'outline', className: "shrink-0", children: ticket.priority === 'basse' ? 'Basse' : ticket.priority === 'normale' ? 'Normale' : ticket.priority === 'haute' ? 'Haute' : 'Critique' })] }) }, ticket.id))) }) })] }) }), _jsx("div", { className: "lg:col-span-2", children: selectedTicket ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: selectedTicket.subject }), _jsx(CardDescription, { children: selectedTicket.id })] }), _jsx(Badge, { variant: selectedTicket.status === 'ouvert'
                                                                    ? 'destructive'
                                                                    : selectedTicket.status === 'en cours'
                                                                        ? 'secondary'
                                                                        : 'outline', children: selectedTicket.status === 'ouvert' ? 'Ouvert' : selectedTicket.status === 'en cours' ? 'En cours' : 'Résolu' })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Organisation" }), _jsx("p", { className: "font-medium", children: selectedTicket.organizationName })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Cr\u00E9\u00E9" }), _jsx("p", { className: "font-medium", children: formatTimeAgo(new Date(selectedTicket.createdAt)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Assign\u00E9 \u00E0" }), _jsx("p", { className: "font-medium", children: selectedTicket.assignedTo || 'Non assigné' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Derni\u00E8re mise \u00E0 jour" }), _jsx("p", { className: "font-medium", children: formatTimeAgo(new Date(selectedTicket.lastUpdate)) })] })] }), selectedTicket.status !== 'résolu' && (_jsxs("div", { className: "flex gap-2 mt-4", children: [_jsxs("select", { value: selectedTicket.status, onChange: (e) => {
                                                                    const newStatus = e.target.value;
                                                                    const updated = { ...selectedTicket, status: newStatus };
                                                                    setSelectedTicket(updated);
                                                                }, className: "px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm", children: [_jsx("option", { value: "ouvert", children: "Ouvert" }), _jsx("option", { value: "en cours", children: "En cours" }), _jsx("option", { value: "r\u00E9solu", children: "R\u00E9solu" })] }), _jsxs(Button, { size: "sm", onClick: closeTicket, className: "gap-1", children: [_jsx(CheckCircle, { className: "h-4 w-4" }), "Fermer"] })] }))] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5] mb-2", children: "R\u00E9ponses" }), _jsxs("div", { className: "space-y-3 max-h-48 overflow-y-auto", children: [_jsxs("div", { className: "bg-[#12121A] rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Client - 2026-04-01 10:30" }), _jsx("p", { className: "text-sm text-[#F0F0F5]", children: "Nous avons un probl\u00E8me urgent avec l'int\u00E9gration GPS." })] }), _jsxs("div", { className: "bg-[#12121A] rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Support - 2026-04-01 11:00" }), _jsx("p", { className: "text-sm text-[#F0F0F5]", children: "Merci de nous signaler ce probl\u00E8me. Nous enqu\u00EAtons." })] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5] mb-2", children: "Ajouter une r\u00E9ponse" }), _jsx("textarea", { value: ticketReply, onChange: e => setTicketReply(e.target.value), placeholder: "Tapez votre r\u00E9ponse...", className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3 }), _jsxs(Button, { className: "mt-2 gap-2", onClick: submitTicketReply, children: [_jsx(Send, { className: "h-4 w-4" }), "Envoyer la r\u00E9ponse"] })] })] }) })] })) : (_jsx(Card, { className: "flex items-center justify-center h-96", children: _jsx("p", { className: "text-[#6B6B80]", children: "S\u00E9lectionnez un ticket pour voir les d\u00E9tails" }) })) })] })] })), activeTab === 'billing' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "S\u00E9lectionner une organisation" }), _jsx("select", { value: selectedOrgForBilling, onChange: e => setSelectedOrgForBilling(e.target.value), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: organizations.map(org => (_jsx("option", { value: org.id, children: org.name }, org.id))) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Plan actuel" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5]", children: "Pro" }), _jsx(Badge, { className: "w-fit", children: "Actif" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Montant mensuel" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5]", children: "\u20AC299" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Factur\u00E9 mensuellement" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Prochaine facturation" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5]", children: "01 Mai" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "2026" })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "M\u00E9triques d'utilisation" }), _jsx(CardDescription, { children: "Utilisation actuelle des ressources" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "V\u00E9hicules suivis" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5] mt-2", children: "847 / 1000" }), _jsx("div", { className: "w-full bg-[#1A1A25] rounded-full h-2 mt-3", children: _jsx("div", { className: "bg-[#00E5CC] h-2 rounded-full", style: { width: '84.7%' } }) })] }), _jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Appels API (mois)" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5] mt-2", children: "2.4M / 5M" }), _jsx("div", { className: "w-full bg-[#1A1A25] rounded-full h-2 mt-3", children: _jsx("div", { className: "bg-[#00E5CC] h-2 rounded-full", style: { width: '48%' } }) })] }), _jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Stockage utilis\u00E9" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5] mt-2", children: "45.2 GB / 100 GB" }), _jsx("div", { className: "w-full bg-[#1A1A25] rounded-full h-2 mt-3", children: _jsx("div", { className: "bg-[#00E5CC] h-2 rounded-full", style: { width: '45.2%' } }) })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Modifier le plan" }), _jsx(CardDescription, { children: "Changer le plan d'abonnement" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Starter" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5] mt-2", children: "\u20AC99" }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: "/mois" }), _jsx(Button, { variant: "outline", className: "w-full mt-4", children: "R\u00E9trograder" })] }), _jsxs("div", { className: "rounded-lg border-2 border-[#00E5CC] p-4 bg-[#12121A]", children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Pro" }), _jsx("p", { className: "text-2xl font-bold text-[#00E5CC] mt-2", children: "\u20AC299" }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: "/mois" }), _jsx(Badge, { className: "w-fit mt-4", children: "Plan actuel" })] }), _jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Enterprise" }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5] mt-2", children: "\u20AC1299" }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: "/mois" }), _jsx(Button, { className: "w-full mt-4", children: "Passer \u00E0 Enterprise" })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Historique de facturation" }), _jsx(CardDescription, { children: "Les 12 derni\u00E8res factures" }), _jsxs(Button, { variant: "link", size: "sm", onClick: fetchBillingData, className: "mt-2 gap-1", children: [_jsx(RefreshCw, { className: "h-3 w-3" }), "Actualiser"] })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E]", children: [_jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "Date" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "Description" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "Montant" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-[#F0F0F5]", children: "\u00C9tat" })] }) }), _jsx("tbody", { children: billingData.map(record => (_jsxs("tr", { className: "border-b border-[#1F1F2E] hover:bg-[#12121A]", children: [_jsx("td", { className: "py-3 px-4", children: new Date(record.date).toLocaleDateString('fr-FR') }), _jsx("td", { className: "py-3 px-4", children: record.description }), _jsxs("td", { className: "py-3 px-4 font-medium", children: ["\u20AC", record.amount] }), _jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: record.status === 'payée'
                                                                    ? 'default'
                                                                    : record.status === 'en attente'
                                                                        ? 'secondary'
                                                                        : 'destructive', children: record.status === 'payée' ? 'Payée' : record.status === 'en attente' ? 'En attente' : 'Échouée' }) })] }, record.id))) })] }) }) })] })] })), activeTab === 'whitelabel' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "S\u00E9lectionner une organisation" }), _jsx("select", { value: whitelabelOrg, onChange: e => setWhitelabelOrg(e.target.value), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: organizations.map(org => (_jsx("option", { value: org.id, children: org.name }, org.id))) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Palette, { className: "h-5 w-5" }), "Activation White Label"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "h-4 w-4 rounded border-[#1F1F2E]" }), _jsx("label", { className: "text-sm text-[#F0F0F5]", children: "Activer la personnalisation White Label pour cette organisation" })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Options de marque" }), _jsx(CardDescription, { children: "Personnalisez l'apparence de la plateforme" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5] mb-2", children: "Logo personnalis\u00E9" }), _jsxs("div", { className: "border-2 border-dashed border-[#1F1F2E] rounded-lg p-8 text-center hover:border-[#1F1F2E] transition-colors", children: [_jsx(Upload, { className: "h-8 w-8 text-[#44445A] mx-auto mb-2" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Cliquez pour t\u00E9l\u00E9charger votre logo" }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-1", children: "PNG, JPG ou SVG - Max 5 MB" })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5] mb-2", children: "Couleurs personnalis\u00E9es" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-[#6B6B80] mb-2", children: "Couleur primaire" }), _jsx("input", { type: "color", defaultValue: "#3b82f6", className: "h-10 w-20 rounded border border-[#1F1F2E] cursor-pointer" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-[#6B6B80] mb-2", children: "Couleur secondaire" }), _jsx("input", { type: "color", defaultValue: "#8b5cf6", className: "h-10 w-20 rounded border border-[#1F1F2E] cursor-pointer" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Domaine personnalis\u00E9" }), _jsx(Input, { type: "text", placeholder: "app.votresociete.com", defaultValue: "fleet-tracker.techcorp.com", className: "w-full" }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-2", children: "Configurez les enregistrements DNS pour activer le domaine" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Texte du pied de page" }), _jsx(Input, { type: "text", placeholder: "\u00A9 2026 Votre entreprise. Tous droits r\u00E9serv\u00E9s.", defaultValue: "Propuls\u00E9 par Fleet Tracker", className: "w-full" })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }), _jsx("span", { className: "text-sm text-[#F0F0F5]", children: "Utiliser le logo dans les e-mails" })] }) }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsxs(Button, { className: "gap-2", children: [_jsx(Zap, { className: "h-4 w-4" }), "Enregistrer les modifications"] }), _jsx(Button, { variant: "outline", children: "Aper\u00E7u" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Aper\u00E7u" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "border border-[#1F1F2E] rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50", children: [_jsx("div", { className: "w-24 h-24 rounded-lg bg-[#12121A] border-2 border-[#00E5CC] flex items-center justify-center mb-4", children: _jsx("span", { className: "text-xs text-[#6B6B80]", children: "Logo" }) }), _jsx("p", { className: "text-sm font-medium text-[#F0F0F5] mb-4", children: "Aper\u00E7u de votre marque personnalis\u00E9e" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "\u00A9 2026 Votre entreprise. Tous droits r\u00E9serv\u00E9s." })] }) })] })] })), activeTab === 'echoes' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Circle, { className: "h-3 w-3 text-[#00E5CC] fill-[#00E5CC]" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "En ligne" })] }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5]", children: "2" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Circle, { className: "h-3 w-3 text-[#44445A] fill-gray-400" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Hors ligne" })] }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5]", children: "1" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Circle, { className: "h-3 w-3 text-yellow-600 fill-yellow-600" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Maintenance" })] }), _jsx("p", { className: "text-2xl font-bold text-[#F0F0F5]", children: "1" })] }) }) })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'online', 'offline', 'maintenance'].map(status => (_jsx(Button, { variant: trackerStatusFilter === status ? 'default' : 'outline', size: "sm", onClick: () => setTrackerStatusFilter(status), children: status === 'all' ? 'Tous' : status === 'online' ? 'En ligne' : status === 'offline' ? 'Hors ligne' : 'Maintenance' }, status))) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Radio, { className: "h-5 w-5" }), "Trackers Echoes"] }), _jsx(CardDescription, { children: "G\u00E9rer les trackers et envoyer des commandes" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: mockTrackers
                                        .filter(t => trackerStatusFilter === 'all' || t.status === trackerStatusFilter)
                                        .map(tracker => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1F1F2E] p-4 hover:border-[#1F1F2E] transition-colors", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Circle, { className: `h-3 w-3 ${tracker.status === 'online'
                                                                    ? 'text-[#00E5CC] fill-[#00E5CC]'
                                                                    : tracker.status === 'offline'
                                                                        ? 'text-[#44445A] fill-gray-400'
                                                                        : 'text-yellow-600 fill-yellow-600'}` }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: tracker.name })] }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-sm text-[#6B6B80]", children: [_jsx("span", { children: tracker.organizationName }), _jsxs("span", { children: ["Dernier contact:", ' ', _jsx("span", { className: "font-medium", children: formatTimeAgo(new Date(tracker.lastCommunication)) })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: tracker.status === 'online'
                                                            ? 'default'
                                                            : tracker.status === 'offline'
                                                                ? 'secondary'
                                                                : 'outline', className: "capitalize", children: tracker.status === 'online' ? 'En ligne' : tracker.status === 'offline' ? 'Hors ligne' : 'Maintenance' }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1 text-xs", children: [_jsx(Zap, { className: "h-3 w-3" }), "Commandes"] })] })] }, tracker.id))) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Commandes disponibles" }), _jsx(CardDescription, { children: "Envoyer des commandes aux trackers Echoes" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs(Button, { variant: "outline", className: "gap-2 h-auto flex-col justify-start p-4", children: [_jsx(Radio, { className: "h-5 w-5 text-[#00E5CC]" }), _jsx("span", { className: "text-sm font-medium", children: "Localiser" }), _jsx("span", { className: "text-xs text-[#6B6B80]", children: "Position GPS imm\u00E9diate" })] }), _jsxs(Button, { variant: "outline", className: "gap-2 h-auto flex-col justify-start p-4", children: [_jsx(Power, { className: "h-5 w-5 text-[#FF4D6A]" }), _jsx("span", { className: "text-sm font-medium", children: "Red\u00E9marrer" }), _jsx("span", { className: "text-xs text-[#6B6B80]", children: "Red\u00E9marrage du tracker" })] }), _jsxs(Button, { variant: "outline", className: "gap-2 h-auto flex-col justify-start p-4", children: [_jsx(AlertOctagon, { className: "h-5 w-5 text-yellow-600" }), _jsx("span", { className: "text-sm font-medium", children: "Diagnostic" }), _jsx("span", { className: "text-xs text-[#6B6B80]", children: "\u00C9tat et sant\u00E9 du tracker" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Wifi, { className: "h-5 w-5" }), "\u00C9tat de la connexion"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80] mb-2", children: "Serveur Echoes" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Circle, { className: "h-3 w-3 text-[#00E5CC] fill-[#00E5CC]" }), _jsx("p", { className: "font-medium text-[#00E5CC]", children: "Connect\u00E9" })] }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-2", children: "Latence: 42ms" })] }), _jsxs("div", { className: "rounded-lg border border-[#1F1F2E] p-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80] mb-2", children: "Synchronisation" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: "\u00C0 jour" }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-2", children: "Derni\u00E8re sync: \u00E0 l'instant" })] })] }) })] })] })), showOrgModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: editingOrg ? 'Éditer organisation' : 'Créer une organisation' }), _jsx(CardDescription, { children: editingOrg ? 'Modifiez les détails de l\'organisation' : 'Créez une nouvelle organisation' })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Nom" }), _jsx(Input, { value: orgFormData.name, onChange: e => setOrgFormData({ ...orgFormData, name: e.target.value }), placeholder: "Nom de l'organisation" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Plan" }), _jsxs("select", { value: orgFormData.plan, onChange: e => setOrgFormData({ ...orgFormData, plan: e.target.value }), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm", children: [_jsx("option", { value: "Starter", children: "Starter" }), _jsx("option", { value: "Pro", children: "Pro" }), _jsx("option", { value: "Enterprise", children: "Enterprise" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Param\u00E8tres" }), _jsx(Input, { value: orgFormData.settings, onChange: e => setOrgFormData({ ...orgFormData, settings: e.target.value }), placeholder: "Param\u00E8tres additionnels (JSON)" })] }), _jsxs("div", { className: "flex gap-2 justify-end pt-4", children: [_jsx(Button, { variant: "outline", onClick: closeOrgModal, children: "Annuler" }), _jsx(Button, { onClick: saveOrganization, children: editingOrg ? 'Mettre à jour' : 'Créer' })] })] }) })] }) })), showUserModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: editingUser ? 'Éditer utilisateur' : 'Créer un utilisateur' }), _jsx(CardDescription, { children: editingUser ? 'Modifiez les détails de l\'utilisateur' : 'Créez un nouvel utilisateur' })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Nom" }), _jsx(Input, { value: userFormData.name, onChange: e => setUserFormData({ ...userFormData, name: e.target.value }), placeholder: "Nom complet" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Email" }), _jsx(Input, { value: userFormData.email, onChange: e => setUserFormData({ ...userFormData, email: e.target.value }), placeholder: "email@example.com", type: "email" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "R\u00F4le" }), _jsxs("select", { value: userFormData.role, onChange: e => setUserFormData({ ...userFormData, role: e.target.value }), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm", children: [_jsx("option", { value: "super_admin", children: "Super Admin" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "manager", children: "Manager" }), _jsx("option", { value: "operator", children: "Op\u00E9rateur" }), _jsx("option", { value: "driver", children: "Conducteur" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-2", children: "Organisation" }), _jsxs("select", { value: userFormData.organizationId, onChange: e => setUserFormData({ ...userFormData, organizationId: e.target.value }), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm", children: [_jsx("option", { value: "", children: "-- S\u00E9lectionner une organisation --" }), organizations.map(org => (_jsx("option", { value: org.id, children: org.name }, org.id)))] })] }), _jsxs("div", { className: "flex gap-2 justify-end pt-4", children: [_jsx(Button, { variant: "outline", onClick: closeUserModal, children: "Annuler" }), _jsx(Button, { onClick: saveUser, children: editingUser ? 'Mettre à jour' : 'Créer' })] })] }) })] }) }))] }));
}
//# sourceMappingURL=SuperAdminPage.js.map