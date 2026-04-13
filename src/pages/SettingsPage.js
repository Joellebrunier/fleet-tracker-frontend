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
import { Key, Database, MapPin, Globe, Copy, RefreshCw, Eye, EyeOff, Wifi, User, Bell, Palette, Shield, Plus, Trash2, Save, Check, Smartphone, Lock, BarChart3, Mail, AlertCircle, Send, X } from 'lucide-react';
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
    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([
        'ABCD-1234-EFGH', 'IJKL-5678-MNOP', 'QRST-9012-UVWX',
        'YZAB-3456-CDEF', 'GHIJ-7890-KLMN', 'OPQR-1234-STUV',
        'WXYZ-5678-ABCD', 'EFGH-9012-IJKL'
    ]);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [twoFASaving, setTwoFASaving] = useState(false);
    // IP Restrictions state
    const [ipRestrictionsEnabled, setIpRestrictionsEnabled] = useState(false);
    const [whitelistedIPs, setWhitelistedIPs] = useState([
        { id: '1', ip: '192.168.1.100', description: 'Bureau principal', addedDate: '2025-01-15' },
        { id: '2', ip: '10.0.0.50', description: 'VPN entreprise', addedDate: '2025-01-10' }
    ]);
    const [currentIP, setCurrentIP] = useState('203.0.113.42');
    const [newIPAddress, setNewIPAddress] = useState('');
    const [newIPDescription, setNewIPDescription] = useState('');
    const [ipSaving, setIpSaving] = useState(false);
    // Activity Logs state
    const [activityLogs, setActivityLogs] = useState([
        { id: '1', date: '2025-03-15 14:32:18', action: 'Connexion', ip: '192.168.1.100', browser: 'Chrome 125.0' },
        { id: '2', date: '2025-03-15 10:15:45', action: 'Modification paramètres', ip: '192.168.1.100', browser: 'Chrome 125.0' },
        { id: '3', date: '2025-03-14 18:20:30', action: 'Téléchargement rapport', ip: '10.0.0.50', browser: 'Firefox 124.0' },
        { id: '4', date: '2025-03-14 12:45:10', action: 'Création utilisateur', ip: '192.168.1.100', browser: 'Chrome 125.0' },
        { id: '5', date: '2025-03-13 16:32:55', action: 'Connexion', ip: '203.0.113.42', browser: 'Safari 18.1' },
        { id: '6', date: '2025-03-13 09:10:20', action: 'Modification profil', ip: '192.168.1.100', browser: 'Chrome 125.0' },
        { id: '7', date: '2025-03-12 22:15:40', action: 'Déconnexion', ip: '192.168.1.100', browser: 'Chrome 125.0' },
        { id: '8', date: '2025-03-12 15:42:18', action: 'Export données', ip: '10.0.0.50', browser: 'Firefox 124.0' },
        { id: '9', date: '2025-03-11 11:35:22', action: 'Connexion', ip: '192.168.1.100', browser: 'Chrome 125.0' },
        { id: '10', date: '2025-03-10 14:20:45', action: 'Changement mot de passe', ip: '203.0.113.42', browser: 'Safari 18.1' }
    ]);
    const [logStartDate, setLogStartDate] = useState('2025-03-01');
    const [logEndDate, setLogEndDate] = useState('2025-03-15');
    // Pending Invitations state
    const [pendingInvitations, setPendingInvitations] = useState([
        { id: '1', email: 'alice.dupont@example.com', role: 'Opérateur', status: 'En attente', sentDate: '2025-03-10', expiryDate: '2025-03-17' },
        { id: '2', email: 'bob.martin@example.com', role: 'Superviseur', status: 'En attente', sentDate: '2025-03-12', expiryDate: '2025-03-19' },
        { id: '3', email: 'carol.bernard@example.com', role: 'Opérateur', status: 'Accepté', sentDate: '2025-03-01', expiryDate: '2025-03-08' }
    ]);
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
    const handleEnable2FA = async () => {
        setShow2FASetup(true);
    };
    const handleDisable2FA = async () => {
        setTwoFactorEnabled(false);
        setShow2FASetup(false);
        setVerificationCode('');
    };
    const handleVerify2FA = () => {
        if (verificationCode.length === 6) {
            setTwoFASaving(true);
            setTimeout(() => {
                setTwoFactorEnabled(true);
                setShowBackupCodes(true);
                setTwoFASaving(false);
                setVerificationCode('');
            }, 1000);
        }
    };
    const handleAddIPAddress = async () => {
        if (!newIPAddress.trim())
            return;
        const newIP = {
            id: String(Date.now()),
            ip: newIPAddress,
            description: newIPDescription,
            addedDate: new Date().toISOString().split('T')[0]
        };
        setWhitelistedIPs([...whitelistedIPs, newIP]);
        setNewIPAddress('');
        setNewIPDescription('');
    };
    const handleRemoveIPAddress = (ipId) => {
        setWhitelistedIPs(whitelistedIPs.filter(ip => ip.id !== ipId));
    };
    const handleResendInvitation = (inviteId) => {
        console.log('Resending invitation:', inviteId);
    };
    const handleCancelInvitation = (inviteId) => {
        setPendingInvitations(prev => prev.filter(inv => inv.id !== inviteId));
    };
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'admin' || user?.role === 'administrator';
    return (_jsxs("div", { className: "min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Param\u00E8tres" }), _jsx("p", { className: "mt-2 text-gray-500", children: "G\u00E9rez votre profil et vos pr\u00E9f\u00E9rences" })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(User, { size: 20 }), "Profil"] }), _jsx(CardDescription, { children: "G\u00E9rez les informations de votre compte" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "Pr\u00E9nom" }), _jsx(Input, { type: "text", value: user?.firstName || '', disabled: !isEditing, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "Nom" }), _jsx(Input, { type: "text", value: user?.lastName || '', disabled: !isEditing, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "Email" }), _jsx(Input, { type: "email", value: user?.email || '', disabled: true, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "R\u00F4le" }), _jsx(Input, { type: "text", value: user?.role || '', disabled: true, className: "mt-1" })] }), _jsx(Button, { onClick: () => setIsEditing(!isEditing), className: "w-full", variant: isEditing ? 'default' : 'outline', children: isEditing ? 'Enregistrer' : 'Modifier le profil' })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Smartphone, { size: 20 }), "Authentification \u00E0 deux facteurs"] }), _jsx(CardDescription, { children: "S\u00E9curisez votre compte avec l'authentification \u00E0 deux facteurs" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-100", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Lock, { size: 18, className: twoFactorEnabled ? 'text-[#22C55E]' : 'text-gray-500' }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Statut 2FA" }), _jsx("p", { className: "text-sm text-gray-500", children: twoFactorEnabled ? 'Activé' : 'Désactivé' })] })] }), !twoFactorEnabled ? (_jsx(Button, { onClick: handleEnable2FA, className: "bg-blue-600 text-white hover:bg-blue-600/80", children: "Activer" })) : (_jsx(Button, { onClick: handleDisable2FA, variant: "destructive", children: "D\u00E9sactiver" }))] }), show2FASetup && !twoFactorEnabled && (_jsxs("div", { className: "space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-100", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Code QR" }), _jsx("div", { className: "flex justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm", children: _jsx("div", { className: "w-40 h-40 bg-gradient-to-br from-blue-600 to-[#FFFFFF] rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-gray-500 text-xs text-center", children: "QR Code Placeholder" }) }) }), _jsx("p", { className: "text-xs text-gray-500 text-center", children: "Scannez ce code avec votre application authenticateur" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-2", children: "Code de v\u00E9rification (6 chiffres)" }), _jsx(Input, { type: "text", placeholder: "000000", value: verificationCode, onChange: (e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)), maxLength: 6, className: "text-center text-lg tracking-widest" })] }), _jsx(Button, { onClick: handleVerify2FA, disabled: verificationCode.length !== 6 || twoFASaving, className: "w-full", children: twoFASaving ? 'Vérification...' : 'Vérifier et activer' })] })), twoFactorEnabled && showBackupCodes && (_jsxs("div", { className: "space-y-3 p-4 border border-amber-500 rounded-lg bg-amber-500/10", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(AlertCircle, { size: 18, className: "text-amber-500 flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Codes de sauvegarde" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Conservez ces codes en s\u00E9curit\u00E9. Vous en aurez besoin si vous perdez l'acc\u00E8s \u00E0 votre appareil." })] })] }), _jsx("div", { className: "grid grid-cols-2 gap-2 p-3 bg-white rounded-lg", children: backupCodes.map((code, idx) => (_jsxs("div", { className: "flex items-center gap-2 font-mono text-sm text-gray-900", children: [_jsxs("span", { className: "flex-shrink-0 text-gray-500", children: [idx + 1, "."] }), _jsx("span", { children: code })] }, idx))) }), _jsxs(Button, { onClick: () => {
                                            navigator.clipboard.writeText(backupCodes.join('\n'));
                                        }, variant: "outline", className: "w-full gap-2", children: [_jsx(Copy, { size: 16 }), "Copier les codes"] }), _jsx(Button, { onClick: () => setShowBackupCodes(false), className: "w-full bg-blue-600 text-white hover:bg-blue-600/80", children: "J'ai sauvegard\u00E9 les codes" })] }))] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { size: 20 }), "Restrictions d'acc\u00E8s par IP"] }), _jsx(CardDescription, { children: "Contr\u00F4lez l'acc\u00E8s \u00E0 partir d'adresses IP sp\u00E9cifiques" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-100", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Restrictions d'IP activ\u00E9es" }), _jsxs("p", { className: "text-sm text-gray-500", children: [whitelistedIPs.length, " IP autoris\u00E9e(s)"] })] }), _jsx("input", { type: "checkbox", checked: ipRestrictionsEnabled, onChange: (e) => setIpRestrictionsEnabled(e.target.checked), className: "h-4 w-4" })] }), _jsxs("div", { className: "p-3 bg-gray-100 rounded-lg border border-gray-200", children: [_jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Votre adresse IP actuelle" }), _jsxs("div", { className: "flex items-center gap-2 font-mono text-gray-900", children: [_jsx("span", { className: "font-bold", children: currentIP }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => navigator.clipboard.writeText(currentIP), className: "text-blue-600 hover:text-blue-600", children: _jsx(Copy, { size: 14 }) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Ajouter une IP \u00E0 la liste blanche" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(Input, { type: "text", placeholder: "192.168.1.100", value: newIPAddress, onChange: (e) => setNewIPAddress(e.target.value), className: "bg-white border-gray-200" }), _jsx(Input, { type: "text", placeholder: "Description (ex: Bureau)", value: newIPDescription, onChange: (e) => setNewIPDescription(e.target.value), className: "bg-white border-gray-200" }), _jsxs(Button, { onClick: handleAddIPAddress, disabled: !newIPAddress.trim(), className: "bg-blue-600 text-white hover:bg-blue-600/80", children: [_jsx(Plus, { size: 16 }), "Ajouter"] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "IPs autoris\u00E9es" }), whitelistedIPs.length > 0 ? (_jsx("div", { className: "space-y-2", children: whitelistedIPs.map((ip) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-100", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-mono text-gray-900 font-medium", children: ip.ip }), _jsxs("p", { className: "text-xs text-gray-500", children: [ip.description, " \u2022 Ajout\u00E9e le ", ip.addedDate] })] }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleRemoveIPAddress(ip.id), className: "text-red-500 hover:text-red-500", children: _jsx(Trash2, { size: 14 }) })] }, ip.id))) })) : (_jsx("p", { className: "text-sm text-gray-500", children: "Aucune IP ajout\u00E9e pour le moment" }))] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(BarChart3, { size: 20 }), "Journal d'activit\u00E9"] }), _jsx(CardDescription, { children: "Historique de vos connexions et actions" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-2", children: "Du" }), _jsx(Input, { type: "date", value: logStartDate, onChange: (e) => setLogStartDate(e.target.value), className: "bg-white border-gray-200" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-2", children: "Au" }), _jsx(Input, { type: "date", value: logEndDate, onChange: (e) => setLogEndDate(e.target.value), className: "bg-white border-gray-200" })] })] }), _jsx("div", { className: "overflow-x-auto border border-gray-200 rounded-lg", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-gray-500 font-medium", children: "Date" }), _jsx("th", { className: "px-4 py-3 text-left text-gray-500 font-medium", children: "Action" }), _jsx("th", { className: "px-4 py-3 text-left text-gray-500 font-medium", children: "IP" }), _jsx("th", { className: "px-4 py-3 text-left text-gray-500 font-medium", children: "Navigateur" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: activityLogs.map((log) => (_jsxs("tr", { className: "hover:bg-gray-100 transition-colors", children: [_jsx("td", { className: "px-4 py-3 text-gray-900 font-mono text-xs", children: log.date }), _jsx("td", { className: "px-4 py-3 text-gray-900", children: log.action }), _jsx("td", { className: "px-4 py-3 text-gray-900 font-mono text-xs", children: log.ip }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: log.browser })] }, log.id))) })] }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Mail, { size: 20 }), "Collaborateurs"] }), _jsx(CardDescription, { children: "G\u00E9rez les membres de votre \u00E9quipe" })] }), _jsxs(CardContent, { className: "space-y-6", children: [pendingInvitations.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Invitations en attente" }), _jsx("div", { className: "space-y-2", children: pendingInvitations.map((invite) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-100", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: invite.email }), _jsxs("p", { className: "text-xs text-gray-500", children: ["R\u00F4le: ", invite.role, " \u2022 ", invite.status, invite.status === 'En attente' && ` • Expire le ${invite.expiryDate}`] })] }), _jsx("div", { className: "flex gap-2", children: invite.status === 'En attente' && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleResendInvitation(invite.id), className: "text-blue-600 hover:text-blue-600", children: _jsx(Send, { size: 14 }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleCancelInvitation(invite.id), className: "text-red-500 hover:text-red-500", children: _jsx(X, { size: 14 }) })] })) })] }, invite.id))) })] })), _jsxs("div", { className: "space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-100", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Inviter par e-mail" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => setShowInviteForm(!showInviteForm), children: showInviteForm ? _jsx(X, { size: 16 }) : _jsx(Plus, { size: 16 }) })] }), showInviteForm && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-2", children: "Adresse email" }), _jsx(Input, { type: "email", placeholder: "collaborateur@example.com", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), className: "bg-white border-gray-200" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-2", children: "R\u00F4le" }), _jsxs("select", { value: inviteRole, onChange: (e) => setInviteRole(e.target.value), className: "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900", children: [_jsx("option", { children: "Op\u00E9rateur" }), _jsx("option", { children: "Superviseur" }), _jsx("option", { children: "Administrateur" })] })] }), _jsxs(Button, { onClick: handleInviteCollaborator, disabled: !inviteEmail.trim(), className: "w-full bg-blue-600 text-white hover:bg-blue-600/80", children: [_jsx(Send, { size: 16, className: "mr-2" }), "Envoyer l'invitation"] })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Collaborateurs actuels" }), collabsLoading ? (_jsx("p", { className: "text-sm text-gray-500", children: "Chargement..." })) : collaborators.length > 0 ? (_jsx("div", { className: "space-y-2", children: collaborators.map((collab) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-100", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: collab.name }), _jsx("p", { className: "text-xs text-gray-500", children: collab.email })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: collab.role, onChange: (e) => handleUpdateCollaboratorRole(collab.id, e.target.value), className: "rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-900", children: [_jsx("option", { children: "Op\u00E9rateur" }), _jsx("option", { children: "Superviseur" }), _jsx("option", { children: "Administrateur" })] }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDeleteCollaborator(collab.id), className: "text-red-500 hover:text-red-500", children: _jsx(Trash2, { size: 14 }) })] })] }, collab.id))) })) : (_jsx("p", { className: "text-sm text-gray-500", children: "Aucun collaborateur pour le moment" }))] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Globe, { size: 20 }), "Organisation"] }), _jsx(CardDescription, { children: "G\u00E9rez les informations de votre organisation" })] }), _jsx(CardContent, { className: "space-y-6", children: orgLoading ? (_jsx("p", { className: "text-sm text-gray-500", children: "Chargement..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "Nom de l'organisation" }), _jsx(Input, { type: "text", value: organization.name, disabled: !orgEditing, onChange: (e) => setOrganization({ ...organization, name: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "Adresse" }), _jsx(Input, { type: "text", value: organization.address, disabled: !orgEditing, onChange: (e) => setOrganization({ ...organization, address: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500", children: "T\u00E9l\u00E9phone" }), _jsx(Input, { type: "text", value: organization.phone, disabled: !orgEditing, onChange: (e) => setOrganization({ ...organization, phone: e.target.value }), className: "mt-1" })] }), _jsx(Button, { onClick: handleSaveOrganization, className: "w-full", variant: orgEditing ? 'default' : 'outline', children: orgEditing ? 'Enregistrer' : 'Modifier l\'organisation' })] })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Bell, { size: 20 }), "Pr\u00E9f\u00E9rences de notification"] }), _jsx(CardDescription, { children: "Configurez comment vous recevez les alertes" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Alertes email" }), _jsx("p", { className: "text-xs text-gray-500", children: "Recevoir les alertes par email" })] }), _jsx("input", { type: "checkbox", defaultChecked: true, className: "h-4 w-4" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Notifications push" }), _jsx("p", { className: "text-xs text-gray-500", children: "Configurer l'app mobile" })] }), _jsx("input", { type: "checkbox", disabled: true, className: "h-4 w-4" })] })] }), _jsxs("div", { className: "pt-4 border-t border-gray-200 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Heures silencieuses" }), _jsx("input", { type: "checkbox", checked: quietHoursEnabled, onChange: (e) => setQuietHoursEnabled(e.target.checked), className: "h-4 w-4" })] }), quietHoursEnabled && (_jsxs("div", { className: "space-y-3 p-3 bg-gray-100 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Aucune notification ne sera envoy\u00E9e pendant ces heures" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "De" }), _jsx("input", { type: "time", value: quietHoursStart, onChange: (e) => setQuietHoursStart(e.target.value), className: "w-full rounded-md border border-gray-200 px-2 py-2 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "\u00C0" }), _jsx("input", { type: "time", value: quietHoursEnd, onChange: (e) => setQuietHoursEnd(e.target.value), className: "w-full rounded-md border border-gray-200 px-2 py-2 text-sm" })] })] }), _jsx(Button, { onClick: handleSaveQuietHours, disabled: quietHoursSaving, size: "sm", className: "w-full gap-2 bg-white hover:bg-gray-50 text-white", children: quietHoursSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 14 }), " Enregistr\u00E9"] })) : quietHoursSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 14, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 14 }), " Enregistrer"] })) })] }))] }), _jsx(Button, { className: "w-full mt-4", children: "Enregistrer les pr\u00E9f\u00E9rences" })] })] }), isAdmin && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Palette, { size: 20 }), "Marque blanche"] }), _jsx(CardDescription, { children: "Personnalisez l'apparence pour votre organisation" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Activer la marque blanche" }), _jsx("input", { type: "checkbox", checked: whiteLabelEnabled, onChange: (e) => setWhiteLabelEnabled(e.target.checked), className: "h-4 w-4" })] }), whiteLabelEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "URL du logo" }), _jsx(Input, { type: "url", value: whiteLabel.logoUrl, onChange: (e) => setWhiteLabel({ ...whiteLabel, logoUrl: e.target.value }), placeholder: "https://example.com/logo.png" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Nom de l'entreprise" }), _jsx(Input, { type: "text", value: whiteLabel.companyName, onChange: (e) => setWhiteLabel({ ...whiteLabel, companyName: e.target.value }), placeholder: "Nom de votre entreprise" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Couleur primaire" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: whiteLabel.primaryColor, onChange: (e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value }), className: "h-10 w-20 rounded border border-gray-200 cursor-pointer" }), _jsx(Input, { type: "text", value: whiteLabel.primaryColor, onChange: (e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value }), placeholder: "#000000", className: "flex-1" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Domaine personnalis\u00E9" }), _jsx(Input, { type: "text", value: whiteLabel.customDomain, onChange: (e) => setWhiteLabel({ ...whiteLabel, customDomain: e.target.value }), placeholder: "app.votreentreprise.com" })] }), _jsx(Button, { onClick: handleSaveWhiteLabel, disabled: whiteLabelSaving, className: "w-full gap-2 bg-white hover:bg-gray-50 text-white", children: whiteLabelSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : whiteLabelSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer les param\u00E8tres de marque blanche"] })) })] }))] })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Wifi, { size: 20 }), "Fournisseurs GPS"] }), _jsx(CardDescription, { children: "Configurez et activez les fournisseurs de suivi GPS" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-3 p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.flespi.enabled ? 'bg-green-500' : 'bg-gray-50'}` }), _jsx("label", { className: "font-medium text-gray-900", children: "Flespi" })] }), _jsx("input", { type: "checkbox", checked: providers.flespi.enabled, onChange: () => handleProviderToggle('flespi'), className: "h-4 w-4" })] }), providers.flespi.enabled && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Token API" }), _jsx(Input, { type: "password", placeholder: "Entrer le token API Flespi", value: providers.flespi.token, onChange: (e) => handleProviderChange('flespi', 'token', e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "ID du canal" }), _jsx(Input, { type: "text", placeholder: "Entrer l'ID du canal", value: providers.flespi.channelId, onChange: (e) => handleProviderChange('flespi', 'channelId', e.target.value) })] })] }))] }), _jsxs("div", { className: "space-y-3 p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.echoes.enabled ? 'bg-green-500' : 'bg-gray-50'}` }), _jsx("label", { className: "font-medium text-gray-900", children: "Echoes" })] }), _jsx("input", { type: "checkbox", checked: providers.echoes.enabled, onChange: () => handleProviderToggle('echoes'), className: "h-4 w-4" })] }), providers.echoes.enabled && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "URL API" }), _jsx(Input, { type: "text", placeholder: "https://api.echoes.com", value: providers.echoes.url, onChange: (e) => handleProviderChange('echoes', 'url', e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Cl\u00E9 de confidentialit\u00E9" }), _jsx(Input, { type: "password", placeholder: "Entrer la cl\u00E9 de confidentialit\u00E9", value: providers.echoes.privacyKey, onChange: (e) => handleProviderChange('echoes', 'privacyKey', e.target.value) })] })] }))] }), _jsxs("div", { className: "space-y-3 p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.keeptrace.enabled ? 'bg-green-500' : 'bg-gray-50'}` }), _jsx("label", { className: "font-medium text-gray-900", children: "KeepTrace" })] }), _jsx("input", { type: "checkbox", checked: providers.keeptrace.enabled, onChange: () => handleProviderToggle('keeptrace'), className: "h-4 w-4" })] }), providers.keeptrace.enabled && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Cl\u00E9 API" }), _jsx(Input, { type: "password", placeholder: "Entrer la cl\u00E9 API KeepTrace", value: providers.keeptrace.apiKey, onChange: (e) => handleProviderChange('keeptrace', 'apiKey', e.target.value) })] }))] }), _jsxs("div", { className: "space-y-3 p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${providers.ubiwan.enabled ? 'bg-green-500' : 'bg-gray-50'}` }), _jsx("label", { className: "font-medium text-gray-900", children: "Ubiwan" })] }), _jsx("input", { type: "checkbox", checked: providers.ubiwan.enabled, onChange: () => handleProviderToggle('ubiwan'), className: "h-4 w-4" })] }), providers.ubiwan.enabled && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "URL du point d'acc\u00E8s" }), _jsx(Input, { type: "text", placeholder: "https://api.ubiwan.com", value: providers.ubiwan.endpoint, onChange: (e) => handleProviderChange('ubiwan', 'endpoint', e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Identifiants" }), _jsx(Input, { type: "password", placeholder: "Entrer les identifiants", value: providers.ubiwan.credentials, onChange: (e) => handleProviderChange('ubiwan', 'credentials', e.target.value) })] })] }))] }), _jsx("div", { className: "flex justify-end pt-2", children: _jsx(Button, { onClick: handleSaveProviders, disabled: providersSaving, className: "gap-2 bg-white hover:bg-gray-50 text-white", children: providersSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : providersSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer les fournisseurs"] })) }) }), _jsxs("div", { className: "border-t border-gray-200 pt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: "Fournisseurs personnalis\u00E9s" }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => setShowAddCustomProvider(!showAddCustomProvider), className: "gap-1", children: [_jsx(Plus, { size: 14 }), "Ajouter un fournisseur personnalis\u00E9"] })] }), showAddCustomProvider && (_jsxs("div", { className: "space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-100 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Nom du fournisseur" }), _jsx(Input, { type: "text", placeholder: "Ex: MonFournisseur GPS", value: newCustomProvider.name, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Type de connexion" }), _jsxs("select", { value: newCustomProvider.type, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, type: e.target.value }), className: "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100", children: [_jsx("option", { value: "HTTP", children: "HTTP / REST" }), _jsx("option", { value: "MQTT", children: "MQTT" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "URL du point d'acc\u00E8s" }), _jsx(Input, { type: "text", placeholder: "https://api.example.com/gps", value: newCustomProvider.endpoint, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, endpoint: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Cl\u00E9 API" }), _jsx(Input, { type: "password", placeholder: "Entrer votre cl\u00E9 API", value: newCustomProvider.apiKey, onChange: (e) => setNewCustomProvider({ ...newCustomProvider, apiKey: e.target.value }) })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                            setShowAddCustomProvider(false);
                                                            setNewCustomProvider({ name: '', type: 'HTTP', endpoint: '', apiKey: '' });
                                                        }, children: "Annuler" }), _jsx(Button, { size: "sm", onClick: handleAddCustomProvider, disabled: customProviderSaving, className: "gap-1", children: customProviderSaving ? 'Ajout...' : 'Ajouter' })] })] })), customProviders.length > 0 && (_jsx("div", { className: "space-y-2", children: customProviders.map((provider) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: provider.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [provider.type, " \u2022 ", provider.endpoint] })] }), _jsx(Button, { size: "sm", variant: "ghost", className: "text-red-500 hover:text-red-500 hover:bg-gray-100", onClick: () => provider.id && handleDeleteCustomProvider(provider.id), children: _jsx(Trash2, { size: 14 }) })] }, provider.id))) }))] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Key, { size: 20 }), "Cl\u00E9s API"] }), _jsx(CardDescription, { children: "G\u00E9rez vos identifiants API" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-2", children: "Votre cl\u00E9 API" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: showApiKey ? 'text' : 'password', value: apiKey, disabled: true, className: "font-mono text-sm" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowApiKey(!showApiKey), className: "px-3", children: showApiKey ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: copyApiKey, className: "px-3", children: _jsx(Copy, { size: 16 }) })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Gardez votre cl\u00E9 API en s\u00E9curit\u00E9. Ne la partagez jamais." })] }), _jsxs(Button, { variant: "destructive", className: "w-full", onClick: regenerateApiKey, children: [_jsx(RefreshCw, { size: 16, className: "mr-2" }), "R\u00E9g\u00E9n\u00E9rer la cl\u00E9 API"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Database, { size: 20 }), "Conservation des donn\u00E9es"] }), _jsx(CardDescription, { children: "Contr\u00F4lez la dur\u00E9e de conservation de l'historique GPS" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-3", children: "P\u00E9riode de conservation de l'historique GPS" }), _jsxs("select", { value: dataRetention, onChange: (e) => setDataRetention(e.target.value), className: "rounded-md border border-gray-200 bg-white px-4 py-2 w-full text-sm font-medium text-gray-500 hover:bg-gray-100", children: [_jsx("option", { value: "30", children: "30 jours" }), _jsx("option", { value: "60", children: "60 jours" }), _jsx("option", { value: "90", children: "90 jours" }), _jsx("option", { value: "180", children: "180 jours" }), _jsx("option", { value: "365", children: "1 an" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Les donn\u00E9es plus anciennes que la p\u00E9riode s\u00E9lectionn\u00E9e seront automatiquement supprim\u00E9es." })] }), _jsx(Button, { onClick: handleSaveDataRetention, disabled: dataRetentionSaving, className: "w-full gap-2 bg-white hover:bg-gray-50 text-white", children: dataRetentionSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : dataRetentionSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer la politique de conservation"] })) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(MapPin, { size: 20 }), "Param\u00E8tres de carte"] }), _jsx(CardDescription, { children: "Configurez les param\u00E8tres de carte par d\u00E9faut" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Latitude du centre" }), _jsx(Input, { type: "text", value: mapDefaults.centerLat, onChange: (e) => handleMapDefaultChange('centerLat', e.target.value), placeholder: "43.7" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Longitude du centre" }), _jsx(Input, { type: "text", value: mapDefaults.centerLng, onChange: (e) => handleMapDefaultChange('centerLng', e.target.value), placeholder: "7.12" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Niveau de zoom par d\u00E9faut" }), _jsx(Input, { type: "text", value: mapDefaults.zoom, onChange: (e) => handleMapDefaultChange('zoom', e.target.value), placeholder: "12" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-500 mb-1", children: "Couche de tuiles" }), _jsxs("select", { value: mapDefaults.tileLayer, onChange: (e) => handleMapDefaultChange('tileLayer', e.target.value), className: "rounded-md border border-gray-200 bg-white px-4 py-2 w-full text-sm font-medium text-gray-500 hover:bg-gray-100", children: [_jsx("option", { value: "streets", children: "Mapbox Plan (streets-v12)" }), _jsx("option", { value: "satellite", children: "Mapbox Satellite (satellite-streets-v12)" }), _jsx("option", { value: "terrain", children: "Mapbox Terrain (outdoors-v12)" }), _jsx("option", { value: "dark", children: "Mapbox Sombre (dark-v11)" })] })] }), _jsx(Button, { onClick: handleSaveMapDefaults, disabled: mapDefaultsSaving, className: "w-full gap-2 bg-white hover:bg-gray-50 text-white", children: mapDefaultsSaved ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), " Enregistr\u00E9"] })) : mapDefaultsSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { size: 16, className: "animate-spin" }), " Enregistrement..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Enregistrer les param\u00E8tres de carte"] })) })] })] }), _jsxs(Card, { className: "border-red-200", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-red-500", children: "Zone dangereuse" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-500", children: "La suppression de votre compte est irr\u00E9versible. Soyez certain de votre choix." }), _jsx(Button, { variant: "destructive", className: "w-full", children: "Supprimer le compte" })] })] })] }));
}
//# sourceMappingURL=SettingsPage.js.map