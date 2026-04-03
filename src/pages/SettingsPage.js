import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Database, MapPin, Globe, Copy, RefreshCw, Eye, EyeOff, Wifi, Server, User, Bell, Palette, Shield, LogOut, Plus, Trash2, Save, Check } from 'lucide-react';
export default function SettingsPage() {
    const { user } = useAuth();
    const { theme, setTheme, locale, setLocale } = useUIStore();
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const [isEditing, setIsEditing] = useState(false);
    // Active sessions state
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    // Organization state
    const [organization, setOrganization] = useState({ name: '', address: '', phone: '' });
    const [orgEditing, setOrgEditing] = useState(false);
    const [orgLoading, setOrgLoading] = useState(true);
    // Departments state
    const [departments, setDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDesc, setNewDeptDesc] = useState('');
    const [showNewDept, setShowNewDept] = useState(false);
    const [deptsLoading, setDeptsLoading] = useState(true);
    // White label state
    const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
    const [whiteLabel, setWhiteLabel] = useState({
        logoUrl: '',
        primaryColor: '#000000',
        companyName: '',
        customDomain: '',
    });
    // Unit preferences state
    const [speedUnit, setSpeedUnit] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('speedUnit') || 'kmh';
        }
        return 'kmh';
    });
    const [distanceUnit, setDistanceUnit] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('distanceUnit') || 'km';
        }
        return 'km';
    });
    // GPS Provider states
    const [providers, setProviders] = useState({
        flespi: { enabled: false, token: '', channelId: '' },
        echoes: { enabled: false, url: '', privacyKey: '' },
        keeptrace: { enabled: false, apiKey: '' },
        ubiwan: { enabled: false, endpoint: '', credentials: '' },
    });
    // Custom GPS Provider state
    const [customProviders, setCustomProviders] = useState([]);
    const [showAddCustomProvider, setShowAddCustomProvider] = useState(false);
    const [newCustomProvider, setNewCustomProvider] = useState({
        name: '',
        type: 'HTTP',
        endpoint: '',
        apiKey: '',
    });
    const [customProviderSaving, setCustomProviderSaving] = useState(false);
    // API Key state
    const [apiKey, setApiKey] = useState('ft_key_' + 'x'.repeat(24));
    const [showApiKey, setShowApiKey] = useState(false);
    // Data Retention state
    const [dataRetention, setDataRetention] = useState('90');
    // Map Defaults state
    const [mapDefaults, setMapDefaults] = useState({
        centerLat: '43.7',
        centerLng: '7.12',
        zoom: '12',
        tileLayer: 'streets',
    });
    // Quiet Hours state
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
    const [quietHoursStart, setQuietHoursStart] = useState('22:00');
    const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
    // Session Timeout state
    const [sessionTimeout, setSessionTimeout] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sessionTimeout') || '1h';
        }
        return '1h';
    });
    // Collaborators state
    const [collaborators, setCollaborators] = useState([]);
    const [collabsLoading, setCollabsLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Opérateur');
    // White Label saving state
    const [whiteLabelSaving, setWhiteLabelSaving] = useState(false);
    const [whiteLabelSaved, setWhiteLabelSaved] = useState(false);
    // Data Retention saving state
    const [dataRetentionSaving, setDataRetentionSaving] = useState(false);
    const [dataRetentionSaved, setDataRetentionSaved] = useState(false);
    // Map Defaults saving state
    const [mapDefaultsSaving, setMapDefaultsSaving] = useState(false);
    const [mapDefaultsSaved, setMapDefaultsSaved] = useState(false);
    // Quiet Hours saving state
    const [quietHoursSaving, setQuietHoursSaving] = useState(false);
    const [quietHoursSaved, setQuietHoursSaved] = useState(false);
    // Load active sessions
    useEffect(() => {
        const loadSessions = async () => {
            try {
                const response = await apiClient.get(API_ROUTES.AUTH_SESSIONS);
                const data = response.data;
                setSessions(data.sessions || data || []);
            }
            catch (error) {
                // Fallback to current session on error
                setSessions([
                    {
                        id: '1',
                        deviceName: 'Session actuelle',
                        ipAddress: '—',
                        lastActive: new Date().toISOString(),
                    },
                ]);
            }
            finally {
                setSessionsLoading(false);
            }
        };
        loadSessions();
    }, []);
    // Load organization data
    useEffect(() => {
        const loadOrganization = async () => {
            if (!organizationId) {
                setOrgLoading(false);
                return;
            }
            try {
                const response = await apiClient.get(API_ROUTES.ORGANIZATION(organizationId));
                const data = response.data;
                setOrganization({
                    name: data.name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                });
            }
            catch (error) {
                console.error('Failed to load organization:', error);
            }
            finally {
                setOrgLoading(false);
            }
        };
        loadOrganization();
    }, [organizationId]);
    // Load departments
    useEffect(() => {
        const loadDepartments = async () => {
            if (!organizationId) {
                setDeptsLoading(false);
                return;
            }
            try {
                const response = await apiClient.get(API_ROUTES.DEPARTMENTS(organizationId));
                const data = response.data;
                setDepartments(data.departments || data || []);
            }
            catch (error) {
                console.error('Failed to load departments:', error);
            }
            finally {
                setDeptsLoading(false);
            }
        };
        loadDepartments();
    }, [organizationId]);
    // Load GPS providers configuration
    useEffect(() => {
        const loadProviders = async () => {
            if (!organizationId)
                return;
            try {
                const response = await apiClient.get(API_ROUTES.GPS_PROVIDERS(organizationId));
                const data = response.data;
                if (data && typeof data === 'object') {
                    setProviders(prev => ({ ...prev, ...data }));
                }
            }
            catch {
                // Keep defaults if API not available
            }
        };
        loadProviders();
    }, [organizationId]);
    // Load collaborators
    useEffect(() => {
        const loadCollaborators = async () => {
            if (!organizationId) {
                setCollabsLoading(false);
                return;
            }
            try {
                const response = await apiClient.get(`/api/organizations/${organizationId}/users`);
                const data = response.data;
                setCollaborators(data.users || data || []);
            }
            catch (error) {
                console.error('Failed to load collaborators:', error);
            }
            finally {
                setCollabsLoading(false);
            }
        };
        loadCollaborators();
    }, [organizationId]);
    const handleProviderToggle = (provider) => {
        setProviders(prev => ({
            ...prev,
            [provider]: { ...prev[provider], enabled: !prev[provider].enabled }
        }));
    };
    const handleProviderChange = (provider, field, value) => {
        setProviders(prev => ({
            ...prev,
            [provider]: { ...prev[provider], [field]: value }
        }));
    };
    const handleMapDefaultChange = (field, value) => {
        setMapDefaults(prev => ({ ...prev, [field]: value }));
    };
    const handleSaveWhiteLabel = async () => {
        if (!organizationId)
            return;
        setWhiteLabelSaving(true);
        try {
            await apiClient.put(API_ROUTES.ORGANIZATION(organizationId), { whiteLabel });
            setWhiteLabelSaved(true);
            setTimeout(() => setWhiteLabelSaved(false), 3000);
        }
        catch (error) {
            console.error('Failed to save white label:', error);
        }
        finally {
            setWhiteLabelSaving(false);
        }
    };
    const handleSaveDataRetention = async () => {
        if (!organizationId)
            return;
        setDataRetentionSaving(true);
        try {
            await apiClient.patch(API_ROUTES.ORGANIZATION(organizationId), {
                dataRetentionDays: parseInt(dataRetention),
            });
            setDataRetentionSaved(true);
            setTimeout(() => setDataRetentionSaved(false), 3000);
        }
        catch (error) {
            console.error('Failed to save data retention:', error);
        }
        finally {
            setDataRetentionSaving(false);
        }
    };
    const handleSaveMapDefaults = async () => {
        setMapDefaultsSaving(true);
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('mapDefaults', JSON.stringify(mapDefaults));
            }
            setMapDefaultsSaved(true);
            setTimeout(() => setMapDefaultsSaved(false), 3000);
        }
        catch (error) {
            console.error('Failed to save map defaults:', error);
        }
        finally {
            setMapDefaultsSaving(false);
        }
    };
    const handleSaveQuietHours = async () => {
        if (!organizationId)
            return;
        setQuietHoursSaving(true);
        try {
            await apiClient.patch(API_ROUTES.ORGANIZATION(organizationId), {
                quietHours: {
                    enabled: quietHoursEnabled,
                    start: quietHoursStart,
                    end: quietHoursEnd,
                },
            });
            setQuietHoursSaved(true);
            setTimeout(() => setQuietHoursSaved(false), 3000);
        }
        catch (error) {
            console.error('Failed to save quiet hours:', error);
        }
        finally {
            setQuietHoursSaving(false);
        }
    };
    const handleSessionTimeoutChange = (value) => {
        setSessionTimeout(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sessionTimeout', value);
        }
    };
    const handleInviteCollaborator = async () => {
        if (!organizationId || !inviteEmail.trim())
            return;
        try {
            await apiClient.post(`/api/organizations/${organizationId}/users/invite`, {
                email: inviteEmail,
                role: inviteRole,
            });
            setInviteEmail('');
            setInviteRole('Opérateur');
            setShowInviteForm(false);
            // Reload collaborators
            const response = await apiClient.get(`/api/organizations/${organizationId}/users`);
            setCollaborators(response.data.users || response.data || []);
        }
        catch (error) {
            console.error('Failed to invite collaborator:', error);
        }
    };
    const handleDeleteCollaborator = async (userId) => {
        if (!organizationId)
            return;
        try {
            await apiClient.delete(`/api/organizations/${organizationId}/users/${userId}`);
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        }
        catch (error) {
            console.error('Failed to delete collaborator:', error);
        }
    };
    const handleUpdateCollaboratorRole = async (userId, newRole) => {
        if (!organizationId)
            return;
        try {
            await apiClient.patch(`/api/organizations/${organizationId}/users/${userId}`, {
                role: newRole,
            });
            setCollaborators(prev => prev.map(c => (c.id === userId ? { ...c, role: newRole } : c)));
        }
        catch (error) {
            console.error('Failed to update collaborator role:', error);
        }
    };
    const copyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
    };
    const regenerateApiKey = () => {
        const newKey = 'ft_key_' + Math.random().toString(36).substr(2, 24);
        setApiKey(newKey);
    };
    // Save GPS providers
    const [providersSaving, setProvidersSaving] = useState(false);
    const [providersSaved, setProvidersSaved] = useState(false);
    const handleSaveProviders = async () => {
        if (!organizationId)
            return;
        setProvidersSaving(true);
        try {
            await apiClient.put(API_ROUTES.GPS_PROVIDERS(organizationId), providers);
            setProvidersSaved(true);
            setTimeout(() => setProvidersSaved(false), 3000);
        }
        catch (error) {
            console.error('Failed to save GPS providers:', error);
        }
        finally {
            setProvidersSaving(false);
        }
    };
    const handleAddCustomProvider = async () => {
        if (!organizationId || !newCustomProvider.name.trim() || !newCustomProvider.endpoint.trim() || !newCustomProvider.apiKey.trim()) {
            console.error('Veuillez remplir tous les champs');
            return;
        }
        setCustomProviderSaving(true);
        try {
            await apiClient.post(API_ROUTES.GPS_PROVIDERS(organizationId), newCustomProvider);
            setCustomProviders(prev => [...prev, newCustomProvider]);
            setNewCustomProvider({ name: '', type: 'HTTP', endpoint: '', apiKey: '' });
            setShowAddCustomProvider(false);
        }
        catch (error) {
            console.error('Failed to add custom provider:', error);
        }
        finally {
            setCustomProviderSaving(false);
        }
    };
    const handleDeleteCustomProvider = async (providerId) => {
        if (!organizationId)
            return;
        try {
            await apiClient.delete(`${API_ROUTES.GPS_PROVIDERS(organizationId)}/${providerId}`);
            setCustomProviders(prev => prev.filter(p => p.id !== providerId));
        }
        catch (error) {
            console.error('Failed to delete custom provider:', error);
        }
    };
    const handleDisconnectSession = async (sessionId) => {
        try {
            await apiClient.delete(API_ROUTES.AUTH_SESSION_DETAIL(sessionId));
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        }
        catch (error) {
            console.error('Failed to disconnect session:', error);
        }
    };
    const handleDisconnectAllSessions = async () => {
        try {
            await apiClient.delete(API_ROUTES.AUTH_SESSIONS);
            setSessions([]);
        }
        catch (error) {
            console.error('Failed to disconnect all sessions:', error);
        }
    };
    const handleSaveOrganization = async () => {
        if (!organizationId)
            return;
        try {
            await apiClient.patch(API_ROUTES.ORGANIZATION(organizationId), organization);
            setOrgEditing(false);
        }
        catch (error) {
            console.error('Failed to save organization:', error);
        }
    };
    const handleAddDepartment = async () => {
        if (!organizationId || !newDeptName.trim())
            return;
        try {
            const response = await apiClient.post(API_ROUTES.DEPARTMENTS(organizationId), {
                name: newDeptName,
                description: newDeptDesc,
            });
            const data = response.data;
            setDepartments(prev => [...prev, data]);
            setNewDeptName('');
            setNewDeptDesc('');
            setShowNewDept(false);
        }
        catch (error) {
            console.error('Failed to create department:', error);
        }
    };
    const handleDeleteDepartment = async (deptId) => {
        if (!organizationId)
            return;
        try {
            await apiClient.delete(API_ROUTES.DEPARTMENT_DETAIL(organizationId, deptId));
            setDepartments(prev => prev.filter(d => d.id !== deptId));
        }
        catch (error) {
            console.error('Failed to delete department:', error);
        }
    };
    const handleSpeedUnitChange = (value) => {
        setSpeedUnit(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('speedUnit', value);
        }
    };
    const handleDistanceUnitChange = (value) => {
        setDistanceUnit(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('distanceUnit', value);
        }
    };
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'admin' || user?.role === 'administrator';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5]", children: "Param\u00E8tres" }), _jsx("p", { className: "mt-2 text-[#6B6B80]", children: "G\u00E9rez votre profil et vos pr\u00E9f\u00E9rences" })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(User, { size: 20 }), "Profil"] }), _jsx(CardDescription, { children: "G\u00E9rez les informations de votre compte" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "Pr\u00E9nom" }), _jsx(Input, { type: "text", value: user?.firstName || '', disabled: !isEditing, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "Nom" }), _jsx(Input, { type: "text", value: user?.lastName || '', disabled: !isEditing, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "Email" }), _jsx(Input, { type: "email", value: user?.email || '', disabled: true, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "R\u00F4le" }), _jsx(Input, { type: "text", value: user?.role || '', disabled: true, className: "mt-1" })] }), _jsx(Button, { onClick: () => setIsEditing(!isEditing), className: "w-full", variant: isEditing ? 'default' : 'outline', children: isEditing ? 'Enregistrer' : 'Modifier le profil' })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Globe, { size: 20 }), "Organisation"] }), _jsx(CardDescription, { children: "G\u00E9rez les informations de votre organisation" })] }), _jsx(CardContent, { className: "space-y-6", children: orgLoading ? (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Chargement..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "Nom de l'organisation" }), _jsx(Input, { type: "text", value: organization.name, disabled: !orgEditing, onChange: (e) => setOrganization({ ...organization, name: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "Adresse" }), _jsx(Input, { type: "text", value: organization.address, disabled: !orgEditing, onChange: (e) => setOrganization({ ...organization, address: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80]", children: "T\u00E9l\u00E9phone" }), _jsx(Input, { type: "tel", value: organization.phone, disabled: !orgEditing, onChange: (e) => setOrganization({ ...organization, phone: e.target.value }), className: "mt-1" })] }), _jsx("div", { className: "flex gap-2", children: orgEditing ? (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: handleSaveOrganization, className: "flex-1", children: "Enregistrer" }), _jsx(Button, { variant: "outline", className: "flex-1", onClick: () => setOrgEditing(false), children: "Annuler" })] })) : (_jsx(Button, { onClick: () => setOrgEditing(true), variant: "outline", className: "w-full", children: "Modifier l'organisation" })) })] })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Server, { size: 20 }), "D\u00E9partements"] }), _jsx(CardDescription, { children: "G\u00E9rez les d\u00E9partements de votre organisation" })] }), _jsx(CardContent, { className: "space-y-6", children: deptsLoading ? (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Chargement..." })) : (_jsxs(_Fragment, { children: [departments.length > 0 ? (_jsx("div", { className: "space-y-2", children: departments.map((dept) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-[#1A1A25] rounded border border-[#1F1F2E]", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: dept.name }), dept.description && (_jsx("p", { className: "text-xs text-[#6B6B80]", children: dept.description }))] }), _jsx(Button, { variant: "outline", size: "sm", className: "text-[#FF4D6A]", onClick: () => handleDeleteDepartment(dept.id), children: _jsx(Trash2, { size: 16 }) })] }, dept.id))) })) : (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Aucun d\u00E9partement" })), showNewDept ? (_jsxs("div", { className: "space-y-3 p-4 bg-[#1A1A25] rounded-lg border border-[#1F1F2E]", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Nom du d\u00E9partement" }), _jsx(Input, { type: "text", value: newDeptName, onChange: (e) => setNewDeptName(e.target.value), placeholder: "Ex: Logistique" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Description (optionnel)" }), _jsx(Input, { type: "text", value: newDeptDesc, onChange: (e) => setNewDeptDesc(e.target.value), placeholder: "Description du d\u00E9partement" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: handleAddDepartment, className: "flex-1", children: "Cr\u00E9er" }), _jsx(Button, { variant: "outline", className: "flex-1", onClick: () => {
                                                        setShowNewDept(false);
                                                        setNewDeptName('');
                                                        setNewDeptDesc('');
                                                    }, children: "Annuler" })] })] })) : (_jsxs(Button, { variant: "outline", className: "w-full", onClick: () => setShowNewDept(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), "Ajouter un d\u00E9partement"] }))] })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { size: 20 }), "S\u00E9curit\u00E9"] }), _jsx(CardDescription, { children: "G\u00E9rez la s\u00E9curit\u00E9 de votre compte" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Authentification \u00E0 deux facteurs (2FA)" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Ajoutez une couche de s\u00E9curit\u00E9 suppl\u00E9mentaire \u00E0 votre compte" })] }), _jsx(Button, { variant: "outline", children: "Activer" })] }), _jsx("div", { className: "flex items-center justify-between p-4 border border-[#1F1F2E] rounded-lg", children: _jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Derni\u00E8re connexion" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: user?.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Information non disponible' })] }) }), _jsxs("div", { className: "space-y-3 p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Sessions actives" }), _jsxs("p", { className: "text-sm text-[#6B6B80]", children: [sessions.length, " session(s) active(s)"] })] }), sessions.length > 0 && (_jsx(Button, { variant: "outline", className: "text-[#FF4D6A]", onClick: handleDisconnectAllSessions, children: "D\u00E9connecter tout" }))] }), sessionsLoading ? (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Chargement..." })) : sessions.length > 0 ? (_jsx("div", { className: "space-y-2", children: sessions.map((session) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-[#1A1A25] rounded border border-[#1F1F2E]", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: session.deviceName }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["IP: ", session.ipAddress] }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: ["Derni\u00E8re activit\u00E9: ", new Date(session.lastActive).toLocaleString('fr-FR')] })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "text-[#FF4D6A]", onClick: () => handleDisconnectSession(session.id), children: [_jsx(LogOut, { size: 16, className: "mr-1" }), "D\u00E9connecter"] })] }, session.id))) })) : (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Aucune session active" }))] }), _jsxs("div", { className: "flex items-center justify-between p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Changer le mot de passe" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Mettez \u00E0 jour votre mot de passe r\u00E9guli\u00E8rement" })] }), _jsx(Button, { variant: "outline", children: "Modifier" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Palette, { size: 20 }), "Pr\u00E9f\u00E9rences"] }), _jsx(CardDescription, { children: "Personnalisez votre exp\u00E9rience" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-3", children: "Th\u00E8me" }), _jsx("div", { className: "flex gap-4", children: ['light', 'dark'].map((t) => (_jsx("button", { onClick: () => setTheme(t), className: `rounded-lg px-4 py-2 font-medium transition-colors ${theme === t
                                                ? 'bg-fleet-tracker-600 text-white'
                                                : 'bg-[#12121A] text-[#6B6B80] hover:bg-[#1A1A25]'}`, children: t === 'light' ? 'Clair' : 'Sombre' }, t))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-3", children: "Langue" }), _jsxs("select", { value: locale, onChange: (e) => setLocale(e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "es", children: "Espa\u00F1ol" }), _jsx("option", { value: "fr", children: "Fran\u00E7ais" }), _jsx("option", { value: "de", children: "Deutsch" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-3", children: "Unit\u00E9 de vitesse" }), _jsxs("select", { value: speedUnit, onChange: (e) => handleSpeedUnitChange(e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "kmh", children: "Kilom\u00E8tres par heure (km/h)" }), _jsx("option", { value: "mph", children: "Miles par heure (mph)" }), _jsx("option", { value: "kn", children: "N\u0153uds (kn)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-3", children: "Unit\u00E9 de distance" }), _jsxs("select", { value: distanceUnit, onChange: (e) => handleDistanceUnitChange(e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "km", children: "Kilom\u00E8tres (km)" }), _jsx("option", { value: "mi", children: "Miles (mi)" })] })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Wifi, { size: 20 }), "Configuration de session"] }), _jsx(CardDescription, { children: "G\u00E9rez la dur\u00E9e d'inactivit\u00E9 avant d\u00E9connexion" })] }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-3", children: "D\u00E9lai d'expiration de session" }), _jsxs("select", { value: sessionTimeout, onChange: (e) => handleSessionTimeoutChange(e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 w-full text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "30m", children: "30 minutes" }), _jsx("option", { value: "1h", children: "1 heure" }), _jsx("option", { value: "2h", children: "2 heures" }), _jsx("option", { value: "4h", children: "4 heures" }), _jsx("option", { value: "8h", children: "8 heures" }), _jsx("option", { value: "24h", children: "24 heures" }), _jsx("option", { value: "7d", children: "7 jours" })] }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-2", children: "Vous serez automatiquement d\u00E9connect\u00E9 apr\u00E8s cette p\u00E9riode d'inactivit\u00E9." })] }) })] }), isAdmin && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(User, { size: 20 }), "Collaborateurs"] }), _jsx(CardDescription, { children: "G\u00E9rez les utilisateurs et les r\u00F4les de votre organisation" })] }), _jsx(CardContent, { className: "space-y-6", children: collabsLoading ? (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Chargement..." })) : (_jsxs(_Fragment, { children: [collaborators.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "border-b border-[#1F1F2E]", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left py-2 px-3 font-medium text-[#6B6B80]", children: "Nom" }), _jsx("th", { className: "text-left py-2 px-3 font-medium text-[#6B6B80]", children: "Email" }), _jsx("th", { className: "text-left py-2 px-3 font-medium text-[#6B6B80]", children: "R\u00F4le" }), _jsx("th", { className: "text-left py-2 px-3 font-medium text-[#6B6B80]", children: "Derni\u00E8re activit\u00E9" }), _jsx("th", { className: "text-left py-2 px-3 font-medium text-[#6B6B80]", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-[#1F1F2E]", children: collaborators.map((collab) => (_jsxs("tr", { className: "hover:bg-[#1A1A25]", children: [_jsx("td", { className: "py-3 px-3", children: collab.name }), _jsx("td", { className: "py-3 px-3 text-[#6B6B80]", children: collab.email }), _jsx("td", { className: "py-3 px-3", children: _jsxs("select", { value: collab.role, onChange: (e) => handleUpdateCollaboratorRole(collab.id, e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-2 py-1 text-xs font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "Admin", children: "Admin" }), _jsx("option", { value: "Manager", children: "Manager" }), _jsx("option", { value: "Op\u00E9rateur", children: "Op\u00E9rateur" })] }) }), _jsx("td", { className: "py-3 px-3 text-[#6B6B80] text-xs", children: new Date(collab.lastActive).toLocaleString('fr-FR') }), _jsx("td", { className: "py-3 px-3", children: _jsx(Button, { variant: "outline", size: "sm", className: "text-[#FF4D6A]", onClick: () => handleDeleteCollaborator(collab.id), children: _jsx(Trash2, { size: 14 }) }) })] }, collab.id))) })] }) })) : (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Aucun collaborateur" })), showInviteForm ? (_jsxs("div", { className: "space-y-3 p-4 bg-[#1A1A25] rounded-lg border border-[#1F1F2E]", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Email du collaborateur" }), _jsx(Input, { type: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), placeholder: "collaborateur@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "R\u00F4le" }), _jsxs("select", { value: inviteRole, onChange: (e) => setInviteRole(e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 w-full text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "Admin", children: "Admin" }), _jsx("option", { value: "Manager", children: "Manager" }), _jsx("option", { value: "Op\u00E9rateur", children: "Op\u00E9rateur" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: handleInviteCollaborator, className: "flex-1", children: "Inviter" }), _jsx(Button, { variant: "outline", className: "flex-1", onClick: () => {
                                                        setShowInviteForm(false);
                                                        setInviteEmail('');
                                                        setInviteRole('Opérateur');
                                                    }, children: "Annuler" })] })] })) : (_jsxs(Button, { variant: "outline", className: "w-full", onClick: () => setShowInviteForm(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), "Inviter un collaborateur"] }))] })) })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Bell, { size: 20 }), "Notifications"] }), _jsx(CardDescription, { children: "Contr\u00F4lez la r\u00E9ception de vos alertes" })] }), _jsxs(CardContent, { className: "space-y-4", children: [[
                                { label: 'Notifications par email', key: 'email' },
                                { label: 'Notifications push', key: 'push' },
                                { label: 'Notifications SMS', key: 'sms' },
                            ].map((item) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-[#6B6B80]", children: item.label }), _jsx("input", { type: "checkbox", defaultChecked: true, className: "h-4 w-4" })] }, item.key))), _jsx("div", { className: "pt-4 border-t border-[#1F1F2E]", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-[#6B6B80]", children: "WhatsApp" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Bient\u00F4t disponible" })] }), _jsx("input", { type: "checkbox", disabled: true, className: "h-4 w-4" })] }) }), _jsx("div", { className: "pt-4 border-t border-[#1F1F2E]", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-[#6B6B80]", children: "Push mobile" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Configurez l'app mobile" })] }), _jsx("input", { type: "checkbox", disabled: true, className: "h-4 w-4" })] }) }), _jsxs("div", { className: "pt-4 border-t border-[#1F1F2E] space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-[#6B6B80]", children: "Heures silencieuses" }), _jsx("input", { type: "checkbox", checked: quietHoursEnabled, onChange: (e) => setQuietHoursEnabled(e.target.checked), className: "h-4 w-4" })] }), quietHoursEnabled && (_jsxs("div", { className: "space-y-3 p-3 bg-[#1A1A25] rounded-lg", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Aucune notification ne sera envoy\u00E9e pendant ces heures" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#6B6B80] mb-1", children: "De" }), _jsx("input", { type: "time", value: quietHoursStart, onChange: (e) => setQuietHoursStart(e.target.value), className: "w-full rounded-md border border-[#1F1F2E] px-2 py-2 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#6B6B80] mb-1", children: "\u00C0" }), _jsx("input", { type: "time", value: quietHoursEnd, onChange: (e) => setQuietHoursEnd(e.target.value), className: "w-full rounded-md border border-[#1F1F2E] px-2 py-2 text-sm" })] })] }), _jsx(Button, { onClick: handleSaveQuietHours, disabled: quietHoursSaving, size: "sm", className: "w-full gap-2 bg-[#0A0A0F] hover:bg-[#12121A] text-white", children: quietHoursSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 14 }), " Enregistr\u00E9"] })) : quietHoursSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 14, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 14 }), " Enregistrer"] })) })] }))] }), _jsx(Button, { className: "w-full mt-4", children: "Enregistrer les pr\u00E9f\u00E9rences" })] })] }), isAdmin && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Palette, { size: 20 }), "Marque blanche"] }), _jsx(CardDescription, { children: "Personnalisez l'apparence pour votre organisation" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-[#6B6B80]", children: "Activer la marque blanche" }), _jsx("input", { type: "checkbox", checked: whiteLabelEnabled, onChange: (e) => setWhiteLabelEnabled(e.target.checked), className: "h-4 w-4" })] }), whiteLabelEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "URL du logo" }), _jsx(Input, { type: "url", value: whiteLabel.logoUrl, onChange: (e) => setWhiteLabel({ ...whiteLabel, logoUrl: e.target.value }), placeholder: "https://example.com/logo.png" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Nom de l'entreprise" }), _jsx(Input, { type: "text", value: whiteLabel.companyName, onChange: (e) => setWhiteLabel({ ...whiteLabel, companyName: e.target.value }), placeholder: "Nom de votre entreprise" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Couleur primaire" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: whiteLabel.primaryColor, onChange: (e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value }), className: "h-10 w-20 rounded border border-[#1F1F2E] cursor-pointer" }), _jsx(Input, { type: "text", value: whiteLabel.primaryColor, onChange: (e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value }), placeholder: "#000000", className: "flex-1" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Domaine personnalis\u00E9" }), _jsx(Input, { type: "text", value: whiteLabel.customDomain, onChange: (e) => setWhiteLabel({ ...whiteLabel, customDomain: e.target.value }), placeholder: "app.votreentreprise.com" })] }), _jsx(Button, { onClick: handleSaveWhiteLabel, disabled: whiteLabelSaving, className: "w-full gap-2 bg-[#0A0A0F] hover:bg-[#12121A] text-white", children: whiteLabelSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : whiteLabelSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer les param\u00E8tres de marque blanche"] })) })] }))] })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Wifi, { size: 20 }), "Fournisseurs GPS"] }), _jsx(CardDescription, { children: "Configurez et activez les fournisseurs de suivi GPS" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-3 p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.flespi.enabled ? 'bg-green-500' : 'bg-[#1F1F2E]'}` }), _jsx("label", { className: "font-medium text-[#F0F0F5]", children: "Flespi" })] }), _jsx("input", { type: "checkbox", checked: providers.flespi.enabled, onChange: () => handleProviderToggle('flespi'), className: "h-4 w-4" })] }), providers.flespi.enabled && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Token API" }), _jsx(Input, { type: "password", placeholder: "Entrer le token API Flespi", value: providers.flespi.token, onChange: (e) => handleProviderChange('flespi', 'token', e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "ID du canal" }), _jsx(Input, { type: "text", placeholder: "Entrer l'ID du canal", value: providers.flespi.channelId, onChange: (e) => handleProviderChange('flespi', 'channelId', e.target.value) })] })] }))] }), _jsxs("div", { className: "space-y-3 p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.echoes.enabled ? 'bg-green-500' : 'bg-[#1F1F2E]'}` }), _jsx("label", { className: "font-medium text-[#F0F0F5]", children: "Echoes" })] }), _jsx("input", { type: "checkbox", checked: providers.echoes.enabled, onChange: () => handleProviderToggle('echoes'), className: "h-4 w-4" })] }), providers.echoes.enabled && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "URL API" }), _jsx(Input, { type: "text", placeholder: "https://api.echoes.com", value: providers.echoes.url, onChange: (e) => handleProviderChange('echoes', 'url', e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Cl\u00E9 de confidentialit\u00E9" }), _jsx(Input, { type: "password", placeholder: "Entrer la cl\u00E9 de confidentialit\u00E9", value: providers.echoes.privacyKey, onChange: (e) => handleProviderChange('echoes', 'privacyKey', e.target.value) })] })] }))] }), _jsxs("div", { className: "space-y-3 p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.keeptrace.enabled ? 'bg-green-500' : 'bg-[#1F1F2E]'}` }), _jsx("label", { className: "font-medium text-[#F0F0F5]", children: "KeepTrace" })] }), _jsx("input", { type: "checkbox", checked: providers.keeptrace.enabled, onChange: () => handleProviderToggle('keeptrace'), className: "h-4 w-4" })] }), providers.keeptrace.enabled && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Cl\u00E9 API" }), _jsx(Input, { type: "password", placeholder: "Entrer la cl\u00E9 API KeepTrace", value: providers.keeptrace.apiKey, onChange: (e) => handleProviderChange('keeptrace', 'apiKey', e.target.value) })] }))] }), _jsxs("div", { className: "space-y-3 p-4 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.ubiwan.enabled ? 'bg-green-500' : 'bg-[#1F1F2E]'}` }), _jsx("label", { className: "font-medium text-[#F0F0F5]", children: "Ubiwan" })] }), _jsx("input", { type: "checkbox", checked: providers.ubiwan.enabled, onChange: () => handleProviderToggle('ubiwan'), className: "h-4 w-4" })] }), providers.ubiwan.enabled && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "URL du point d'acc\u00E8s" }), _jsx(Input, { type: "text", placeholder: "https://api.ubiwan.com", value: providers.ubiwan.endpoint, onChange: (e) => handleProviderChange('ubiwan', 'endpoint', e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Identifiants" }), _jsx(Input, { type: "password", placeholder: "Entrer les identifiants", value: providers.ubiwan.credentials, onChange: (e) => handleProviderChange('ubiwan', 'credentials', e.target.value) })] })] }))] }), _jsx("div", { className: "flex justify-end pt-2", children: _jsx(Button, { onClick: handleSaveProviders, disabled: providersSaving, className: "gap-2 bg-[#0A0A0F] hover:bg-[#12121A] text-white", children: providersSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : providersSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer les fournisseurs"] })) }) }), _jsxs("div", { className: "border-t border-[#1F1F2E] pt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-[#F0F0F5]", children: "Fournisseurs personnalis\u00E9s" }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => setShowAddCustomProvider(!showAddCustomProvider), className: "gap-1", children: [_jsx(Plus, { size: 14 }), "Ajouter un fournisseur personnalis\u00E9"] })] }), showAddCustomProvider && (_jsxs("div", { className: "space-y-4 p-4 border border-[#1F1F2E] rounded-lg bg-[#1A1A25] mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Nom du fournisseur" }), _jsx(Input, { type: "text", placeholder: "Ex: MonFournisseur GPS", value: newCustomProvider.name, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Type de connexion" }), _jsxs("select", { value: newCustomProvider.type, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, type: e.target.value }), className: "w-full rounded-md border border-[#1F1F2E] bg-white px-3 py-2 text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "HTTP", children: "HTTP / REST" }), _jsx("option", { value: "MQTT", children: "MQTT" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "URL du point d'acc\u00E8s" }), _jsx(Input, { type: "text", placeholder: "https://api.example.com/gps", value: newCustomProvider.endpoint, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, endpoint: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Cl\u00E9 API" }), _jsx(Input, { type: "password", placeholder: "Entrer votre cl\u00E9 API", value: newCustomProvider.apiKey, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, apiKey: e.target.value }) })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                            setShowAddCustomProvider(false);
                                                            setNewCustomProvider({ name: '', type: 'HTTP', endpoint: '', apiKey: '' });
                                                        }, children: "Annuler" }), _jsx(Button, { size: "sm", onClick: handleAddCustomProvider, disabled: customProviderSaving, className: "gap-1", children: customProviderSaving ? 'Ajout...' : 'Ajouter' })] })] })), customProviders.length > 0 && (_jsx("div", { className: "space-y-2", children: customProviders.map((provider) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-[#1F1F2E] rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: provider.name }), _jsxs("p", { className: "text-xs text-[#6B6B80]", children: [provider.type, " \u2022 ", provider.endpoint] })] }), _jsx(Button, { size: "sm", variant: "ghost", className: "text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#1A1A25]", onClick: () => provider.id && handleDeleteCustomProvider(provider.id), children: _jsx(Trash2, { size: 14 }) })] }, provider.id))) }))] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Key, { size: 20 }), "Cl\u00E9s API"] }), _jsx(CardDescription, { children: "G\u00E9rez vos identifiants API" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-2", children: "Votre cl\u00E9 API" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: showApiKey ? 'text' : 'password', value: apiKey, disabled: true, className: "font-mono text-sm" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowApiKey(!showApiKey), className: "px-3", children: showApiKey ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: copyApiKey, className: "px-3", children: _jsx(Copy, { size: 16 }) })] }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-2", children: "Gardez votre cl\u00E9 API en s\u00E9curit\u00E9. Ne la partagez jamais." })] }), _jsxs(Button, { variant: "destructive", className: "w-full", onClick: regenerateApiKey, children: [_jsx(RefreshCw, { size: 16, className: "mr-2" }), "R\u00E9g\u00E9n\u00E9rer la cl\u00E9 API"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Database, { size: 20 }), "Conservation des donn\u00E9es"] }), _jsx(CardDescription, { children: "Contr\u00F4lez la dur\u00E9e de conservation de l'historique GPS" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-3", children: "P\u00E9riode de conservation de l'historique GPS" }), _jsxs("select", { value: dataRetention, onChange: (e) => setDataRetention(e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 w-full text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "30", children: "30 jours" }), _jsx("option", { value: "60", children: "60 jours" }), _jsx("option", { value: "90", children: "90 jours" }), _jsx("option", { value: "180", children: "180 jours" }), _jsx("option", { value: "365", children: "1 an" })] }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-2", children: "Les donn\u00E9es plus anciennes que la p\u00E9riode s\u00E9lectionn\u00E9e seront automatiquement supprim\u00E9es." })] }), _jsx(Button, { onClick: handleSaveDataRetention, disabled: dataRetentionSaving, className: "w-full gap-2 bg-[#0A0A0F] hover:bg-[#12121A] text-white", children: dataRetentionSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : dataRetentionSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer la politique de conservation"] })) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(MapPin, { size: 20 }), "Param\u00E8tres de carte"] }), _jsx(CardDescription, { children: "Configurez les param\u00E8tres de carte par d\u00E9faut" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Latitude du centre" }), _jsx(Input, { type: "text", value: mapDefaults.centerLat, onChange: (e) => handleMapDefaultChange('centerLat', e.target.value), placeholder: "43.7" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Longitude du centre" }), _jsx(Input, { type: "text", value: mapDefaults.centerLng, onChange: (e) => handleMapDefaultChange('centerLng', e.target.value), placeholder: "7.12" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Niveau de zoom par d\u00E9faut" }), _jsx(Input, { type: "text", value: mapDefaults.zoom, onChange: (e) => handleMapDefaultChange('zoom', e.target.value), placeholder: "12" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#6B6B80] mb-1", children: "Couche de tuiles" }), _jsxs("select", { value: mapDefaults.tileLayer, onChange: (e) => handleMapDefaultChange('tileLayer', e.target.value), className: "rounded-md border border-[#1F1F2E] bg-white px-4 py-2 w-full text-sm font-medium text-[#6B6B80] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "streets", children: "Mapbox Plan (streets-v12)" }), _jsx("option", { value: "satellite", children: "Mapbox Satellite (satellite-streets-v12)" }), _jsx("option", { value: "terrain", children: "Mapbox Terrain (outdoors-v12)" }), _jsx("option", { value: "dark", children: "Mapbox Sombre (dark-v11)" })] })] }), _jsx(Button, { onClick: handleSaveMapDefaults, disabled: mapDefaultsSaving, className: "w-full gap-2 bg-[#0A0A0F] hover:bg-[#12121A] text-white", children: mapDefaultsSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : mapDefaultsSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer les param\u00E8tres de carte"] })) })] })] }), _jsxs(Card, { className: "border-red-200", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-[#FF4D6A]", children: "Zone dangereuse" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "La suppression de votre compte est irr\u00E9versible. Soyez certain de votre choix." }), _jsx(Button, { variant: "destructive", className: "w-full", children: "Supprimer le compte" })] })] })] }));
}
//# sourceMappingURL=SettingsPage.js.map