import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { Building2, Plus, Trash2, Save, Key, Truck, ChevronRight, Search, Check, X, Loader2, ArrowLeftRight, AlertCircle, RefreshCw } from 'lucide-react';
const PROVIDER_FIELDS = {
    FLESPI: {
        label: 'Flespi',
        fields: [{ key: 'token', label: 'Token API' }],
    },
    ECHOES: {
        label: 'Echoes',
        fields: [
            { key: 'apiUrl', label: 'URL API' },
            { key: 'accountId', label: 'Account ID' },
            { key: 'apiKey', label: 'Clé API' },
        ],
    },
    KEEPTRACE: {
        label: 'KeepTrace',
        fields: [
            { key: 'apiUrl', label: 'URL API' },
            { key: 'apiKey', label: 'Clé API' },
        ],
    },
    UBIWAN: {
        label: 'Ubiwan',
        fields: [
            { key: 'apiUrl', label: 'URL API' },
            { key: 'username', label: 'Utilisateur' },
            { key: 'password', label: 'Mot de passe (MD5)', type: 'password' },
            { key: 'license', label: 'Licence' },
            { key: 'serverKey', label: 'Server Key' },
        ],
    },
};
export default function OrganizationAdminPage() {
    const user = useAuthStore((s) => s.user);
    const orgId = user?.organizationId || '';
    const [activeTab, setActiveTab] = useState('sub-clients');
    const tabs = [
        { id: 'sub-clients', label: 'Sous-clients', icon: Building2 },
        { id: 'providers', label: 'Fournisseurs GPS', icon: Key },
        { id: 'trackers', label: 'Affectation Trackeurs', icon: Truck },
    ];
    return (_jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Administration Organisation" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "G\u00E9rez vos sous-clients, fournisseurs GPS et affectation de trackeurs" })] }), _jsx("div", { className: "flex gap-1 bg-gray-100 rounded-xl p-1", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${activeTab === tab.id
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`, children: [_jsx(tab.icon, { size: 16 }), tab.label] }, tab.id))) }), activeTab === 'sub-clients' && _jsx(SubClientsTab, { orgId: orgId }), activeTab === 'providers' && _jsx(ProvidersTab, { orgId: orgId }), activeTab === 'trackers' && _jsx(TrackersTab, { orgId: orgId })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// SUB-CLIENTS TAB
// ═══════════════════════════════════════════════════════════════════════════
function SubClientsTab({ orgId }) {
    const [subClients, setSubClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [creating, setCreating] = useState(false);
    const fetchSubClients = useCallback(async () => {
        try {
            setLoading(true);
            const resp = await apiClient.get(API_ROUTES.SUB_CLIENTS(orgId));
            const data = resp.data?.data || resp.data || [];
            setSubClients(Array.isArray(data) ? data : []);
        }
        catch (err) {
            console.error('Error fetching sub-clients:', err);
        }
        finally {
            setLoading(false);
        }
    }, [orgId]);
    useEffect(() => { fetchSubClients(); }, [fetchSubClients]);
    const handleCreate = async () => {
        if (!newName.trim())
            return;
        setCreating(true);
        try {
            const slug = newSlug.trim() || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
            await apiClient.post(API_ROUTES.SUB_CLIENTS(orgId), { name: newName.trim(), slug });
            setNewName('');
            setNewSlug('');
            setShowCreate(false);
            await fetchSubClients();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la création');
        }
        finally {
            setCreating(false);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between p-5 border-b border-gray-100", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Sous-clients" }), _jsxs("p", { className: "text-sm text-gray-500", children: [subClients.length, " sous-client(s)"] })] }), _jsxs("button", { onClick: () => setShowCreate(!showCreate), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { size: 16 }), "Nouveau sous-client"] })] }), showCreate && (_jsx("div", { className: "p-5 border-b border-gray-100 bg-blue-50/50", children: _jsxs("div", { className: "flex gap-3 items-end", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Nom" }), _jsx("input", { type: "text", value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Ex: Transport Martin", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Slug (optionnel)" }), _jsx("input", { type: "text", value: newSlug, onChange: (e) => setNewSlug(e.target.value), placeholder: "transport-martin", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("button", { onClick: handleCreate, disabled: creating || !newName.trim(), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors", children: [creating ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Check, { size: 16 }), "Cr\u00E9er"] }), _jsx("button", { onClick: () => { setShowCreate(false); setNewName(''); setNewSlug(''); }, className: "p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100", children: _jsx(X, { size: 16 }) })] }) })), loading ? (_jsx("div", { className: "p-10 flex justify-center", children: _jsx(Loader2, { size: 24, className: "animate-spin text-blue-600" }) })) : subClients.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-gray-500", children: [_jsx(Building2, { size: 40, className: "mx-auto mb-3 text-gray-300" }), _jsx("p", { className: "font-medium", children: "Aucun sous-client" }), _jsx("p", { className: "text-sm mt-1", children: "Cr\u00E9ez votre premier sous-client pour commencer \u00E0 organiser vos trackeurs." })] })) : (_jsx("div", { className: "divide-y divide-gray-100", children: subClients.map((sc) => (_jsxs("div", { className: "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center", children: _jsx(Building2, { size: 16, className: "text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-gray-900", children: sc.name }), _jsx("p", { className: "text-xs text-gray-500", children: sc.slug })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${sc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`, children: sc.isActive ? 'Actif' : 'Inactif' }), sc.children && sc.children.length > 0 && (_jsxs("span", { className: "text-xs text-gray-400", children: [sc.children.length, " sous-client(s)"] })), _jsx(ChevronRight, { size: 16, className: "text-gray-400" })] })] }, sc.id))) }))] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// PROVIDERS TAB
// ═══════════════════════════════════════════════════════════════════════════
function ProvidersTab({ orgId }) {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProvider, setEditingProvider] = useState(null);
    const [formData, setFormData] = useState({});
    const [formLabel, setFormLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const fetchCredentials = useCallback(async () => {
        try {
            setLoading(true);
            const resp = await apiClient.get(API_ROUTES.PROVIDER_CREDENTIALS(orgId));
            const data = resp.data?.data || resp.data || [];
            setCredentials(Array.isArray(data) ? data : []);
        }
        catch (err) {
            console.error('Error fetching credentials:', err);
        }
        finally {
            setLoading(false);
        }
    }, [orgId]);
    useEffect(() => { fetchCredentials(); }, [fetchCredentials]);
    const handleSave = async (provider) => {
        setSaving(true);
        try {
            await apiClient.post(API_ROUTES.PROVIDER_CREDENTIALS(orgId), {
                provider,
                credentials: formData,
                label: formLabel || undefined,
            });
            setEditingProvider(null);
            setFormData({});
            setFormLabel('');
            await fetchCredentials();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (provider) => {
        if (!confirm(`Supprimer les credentials ${provider} ?`))
            return;
        try {
            await apiClient.delete(API_ROUTES.PROVIDER_CREDENTIAL_DELETE(orgId, provider));
            await fetchCredentials();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };
    const startEdit = (provider) => {
        const existing = credentials.find((c) => c.provider === provider);
        setEditingProvider(provider);
        setFormData(existing?.credentials || {});
        setFormLabel(existing?.label || '');
    };
    return (_jsx("div", { className: "space-y-4", children: Object.entries(PROVIDER_FIELDS).map(([providerKey, config]) => {
            const existing = credentials.find((c) => c.provider === providerKey);
            const isEditing = editingProvider === providerKey;
            return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center ${existing?.isActive ? 'bg-green-100' : 'bg-gray-100'}`, children: _jsx(Key, { size: 16, className: existing?.isActive ? 'text-green-600' : 'text-gray-400' }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: config.label }), existing ? (_jsxs("p", { className: "text-xs text-green-600 font-medium", children: ["Configur\u00E9", existing.label ? ` — ${existing.label}` : ''] })) : (_jsx("p", { className: "text-xs text-gray-400", children: "Non configur\u00E9" }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [existing?.lastError && (_jsxs("span", { className: "text-xs text-red-500 flex items-center gap-1", children: [_jsx(AlertCircle, { size: 12 }), "Erreur"] })), existing?.lastSyncAt && (_jsxs("span", { className: "text-xs text-gray-400", children: ["Sync: ", new Date(existing.lastSyncAt).toLocaleDateString('fr-FR')] })), !isEditing && (_jsx("button", { onClick: () => startEdit(providerKey), className: "px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors", children: existing ? 'Modifier' : 'Configurer' })), existing && !isEditing && (_jsx("button", { onClick: () => handleDelete(providerKey), className: "p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors", children: _jsx(Trash2, { size: 14 }) }))] })] }), isEditing && (_jsxs("div", { className: "p-4 bg-gray-50/50 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Label (optionnel)" }), _jsx("input", { type: "text", value: formLabel, onChange: (e) => setFormLabel(e.target.value), placeholder: `Ex: ${config.label} Production`, className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: config.fields.map((field) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: field.label }), _jsx("input", { type: field.type || 'text', value: formData[field.key] || '', onChange: (e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value })), placeholder: field.label, className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }, field.key))) }), _jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [_jsx("button", { onClick: () => { setEditingProvider(null); setFormData({}); setFormLabel(''); }, className: "px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors", children: "Annuler" }), _jsxs("button", { onClick: () => handleSave(providerKey), disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors", children: [saving ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Save, { size: 16 }), "Enregistrer"] })] })] }))] }, providerKey));
        }) }));
}
// ═══════════════════════════════════════════════════════════════════════════
// TRACKERS ASSIGNMENT TAB
// ═══════════════════════════════════════════════════════════════════════════
function TrackersTab({ orgId }) {
    const [vehicles, setVehicles] = useState([]);
    const [subClients, setSubClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicles, setSelectedVehicles] = useState(new Set());
    const [targetOrgId, setTargetOrgId] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrg, setFilterOrg] = useState('all');
    // Fetch accessible org IDs and their vehicles
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch sub-clients
            const scResp = await apiClient.get(API_ROUTES.SUB_CLIENTS(orgId));
            const scData = scResp.data?.data || scResp.data || [];
            setSubClients(Array.isArray(scData) ? scData : []);
            // Fetch accessible org IDs
            const idsResp = await apiClient.get(API_ROUTES.ORGANIZATION_ACCESSIBLE_IDS(orgId));
            const accessibleIds = idsResp.data?.data || idsResp.data || [orgId];
            // Fetch vehicles for all accessible orgs
            const allVehicles = [];
            for (const oid of accessibleIds) {
                try {
                    const vResp = await apiClient.get(API_ROUTES.VEHICLES(oid) + '?limit=500');
                    const vData = vResp.data?.data?.data || vResp.data?.data || [];
                    if (Array.isArray(vData)) {
                        allVehicles.push(...vData);
                    }
                }
                catch { }
            }
            setVehicles(allVehicles);
        }
        catch (err) {
            console.error('Error fetching data:', err);
        }
        finally {
            setLoading(false);
        }
    }, [orgId]);
    useEffect(() => { fetchData(); }, [fetchData]);
    const toggleSelect = (id) => {
        setSelectedVehicles((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const selectAll = () => {
        const filtered = getFilteredVehicles();
        if (selectedVehicles.size === filtered.length) {
            setSelectedVehicles(new Set());
        }
        else {
            setSelectedVehicles(new Set(filtered.map((v) => v.id)));
        }
    };
    const handleBulkAssign = async () => {
        if (selectedVehicles.size === 0 || !targetOrgId)
            return;
        setAssigning(true);
        try {
            await apiClient.post(API_ROUTES.BULK_ASSIGN_VEHICLES(orgId), {
                vehicleIds: Array.from(selectedVehicles),
                targetOrganizationId: targetOrgId,
            });
            setSelectedVehicles(new Set());
            setTargetOrgId('');
            await fetchData();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'affectation');
        }
        finally {
            setAssigning(false);
        }
    };
    const handleBulkUnassign = async () => {
        if (selectedVehicles.size === 0)
            return;
        setAssigning(true);
        try {
            await apiClient.post(API_ROUTES.BULK_UNASSIGN_VEHICLES(orgId), {
                vehicleIds: Array.from(selectedVehicles),
            });
            setSelectedVehicles(new Set());
            await fetchData();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
        finally {
            setAssigning(false);
        }
    };
    const getFilteredVehicles = () => {
        let filtered = vehicles;
        if (filterOrg !== 'all') {
            filtered = filtered.filter((v) => v.organizationId === filterOrg);
        }
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter((v) => v.name.toLowerCase().includes(q) ||
                v.plate.toLowerCase().includes(q));
        }
        return filtered;
    };
    const filteredVehicles = getFilteredVehicles();
    const getOrgName = (oid) => {
        if (oid === orgId)
            return 'Mon organisation';
        const sc = subClients.find((s) => s.id === oid);
        return sc?.name || oid.slice(0, 8) + '...';
    };
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "p-5 border-b border-gray-100 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Affectation des trackeurs" }), _jsxs("p", { className: "text-sm text-gray-500", children: [vehicles.length, " v\u00E9hicule(s) au total"] })] }), _jsx("button", { onClick: fetchData, className: "p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100", children: _jsx(RefreshCw, { size: 16 }) })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-2.5 text-gray-400" }), _jsx("input", { type: "text", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "Rechercher par nom ou plaque...", className: "w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("select", { value: filterOrg, onChange: (e) => setFilterOrg(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white", children: [_jsx("option", { value: "all", children: "Toutes les organisations" }), _jsx("option", { value: orgId, children: "Mon organisation" }), subClients.map((sc) => (_jsx("option", { value: sc.id, children: sc.name }, sc.id)))] })] }), selectedVehicles.size > 0 && (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200", children: [_jsxs("span", { className: "text-sm font-medium text-blue-700", children: [selectedVehicles.size, " v\u00E9hicule(s) s\u00E9lectionn\u00E9(s)"] }), _jsx("div", { className: "flex-1" }), _jsxs("select", { value: targetOrgId, onChange: (e) => setTargetOrgId(e.target.value), className: "px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Affecter \u00E0..." }), subClients.map((sc) => (_jsx("option", { value: sc.id, children: sc.name }, sc.id)))] }), _jsxs("button", { onClick: handleBulkAssign, disabled: assigning || !targetOrgId, className: "flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors", children: [assigning ? _jsx(Loader2, { size: 14, className: "animate-spin" }) : _jsx(ArrowLeftRight, { size: 14 }), "Affecter"] }), _jsx("button", { onClick: handleBulkUnassign, disabled: assigning, className: "flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors", children: "Rappeler" })] }))] }), loading ? (_jsx("div", { className: "p-10 flex justify-center", children: _jsx(Loader2, { size: 24, className: "animate-spin text-blue-600" }) })) : filteredVehicles.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-gray-500", children: [_jsx(Truck, { size: 40, className: "mx-auto mb-3 text-gray-300" }), _jsx("p", { className: "font-medium", children: "Aucun v\u00E9hicule trouv\u00E9" })] })) : (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase", children: [_jsx("input", { type: "checkbox", checked: selectedVehicles.size === filteredVehicles.length && filteredVehicles.length > 0, onChange: selectAll, className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "flex-1", children: "V\u00E9hicule" }), _jsx("span", { className: "w-32", children: "Plaque" }), _jsx("span", { className: "w-40", children: "Organisation" }), _jsx("span", { className: "w-20 text-center", children: "Statut" })] }), _jsx("div", { className: "divide-y divide-gray-100 max-h-[500px] overflow-y-auto", children: filteredVehicles.map((v) => (_jsxs("div", { className: `flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${selectedVehicles.has(v.id) ? 'bg-blue-50/50' : ''}`, onClick: () => toggleSelect(v.id), children: [_jsx("input", { type: "checkbox", checked: selectedVehicles.has(v.id), onChange: () => toggleSelect(v.id), onClick: (e) => e.stopPropagation(), className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: v.name }) }), _jsx("span", { className: "w-32 text-sm text-gray-600 font-mono", children: v.plate }), _jsx("span", { className: "w-40 text-xs text-gray-500 truncate", children: getOrgName(v.organizationId) }), _jsx("div", { className: "w-20 flex justify-center", children: _jsx("span", { className: `inline-flex h-2 w-2 rounded-full ${v.status === 'active' || v.status === 'ACTIVE'
                                            ? v.currentLat ? 'bg-green-500' : 'bg-yellow-500'
                                            : 'bg-gray-400'}` }) })] }, v.id))) })] }))] }));
}
//# sourceMappingURL=OrganizationAdminPage.js.map