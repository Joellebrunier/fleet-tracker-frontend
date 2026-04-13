import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function TestEnvironmentPage() {
    const [environment, setEnvironment] = useState('development');
    const [sandboxMode, setSandboxMode] = useState(true);
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('');
    const [body, setBody] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [requestHistory, setRequestHistory] = useState([]);
    const baseUrls = {
        production: 'https://api.fleet-tracker.com',
        staging: 'https://staging-api.fleet-tracker.com',
        development: 'http://localhost:3000',
    };
    const generateMockVehicles = () => {
        return Array.from({ length: 10 }, (_, i) => ({
            id: `vehicle-${i + 1}`,
            name: `Camion ${String(i + 1).padStart(2, '0')}`,
            licensePlate: `AB-${String(i + 1).padStart(3, '0')}-CD`,
            status: Math.random() > 0.2 ? 'online' : 'offline',
            latitude: 48.8566 + (Math.random() - 0.5) * 0.5,
            longitude: 2.3522 + (Math.random() - 0.5) * 0.5,
            speed: Math.floor(Math.random() * 120),
        }));
    };
    const generateMockDrivers = () => {
        const firstNames = [
            'Jean',
            'Pierre',
            'Marc',
            'Luc',
            'Paul',
        ];
        const lastNames = [
            'Dupont',
            'Martin',
            'Bernard',
            'Thomas',
            'Robert',
        ];
        return Array.from({ length: 5 }, (_, i) => ({
            id: `driver-${i + 1}`,
            firstName: firstNames[i],
            lastName: lastNames[i],
            phone: `06${String(Math.floor(Math.random() * 10000000)).padStart(8, '0')}`,
            email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`,
            status: Math.random() > 0.1 ? 'active' : 'inactive',
        }));
    };
    const generateMockGeofences = () => {
        return [
            {
                id: 'geofence-1',
                name: 'Zone de dépôt',
                type: 'circle',
                center: { lat: 48.8566, lng: 2.3522 },
                radius: 200,
            },
            {
                id: 'geofence-2',
                name: 'Zone de livraison',
                type: 'circle',
                center: { lat: 48.9022, lng: 2.2897 },
                radius: 500,
            },
            {
                id: 'geofence-3',
                name: 'Zone interdite',
                type: 'polygon',
            },
        ];
    };
    const handleSendRequest = async () => {
        setLoading(true);
        try {
            const fullUrl = `${baseUrls[environment]}${url}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk_test_dummy_key',
                    'X-Sandbox-Mode': sandboxMode ? 'true' : 'false',
                },
            };
            if (method !== 'GET' && body) {
                options.body = body;
            }
            const res = await fetch(fullUrl, options);
            const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }));
            setResponse({
                status: res.status,
                statusText: res.statusText,
                data,
            });
            const newRequest = {
                id: `req-${Date.now()}`,
                method,
                url,
                status: res.status,
                timestamp: new Date(),
                body: method !== 'GET' ? body : undefined,
                response: data,
            };
            setRequestHistory([newRequest, ...requestHistory.slice(0, 9)]);
        }
        catch (error) {
            setResponse({
                error: error.message || 'Erreur réseau',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleGenerateMockData = (type) => {
        let mockData;
        let dataUrl;
        switch (type) {
            case 'vehicles':
                mockData = generateMockVehicles();
                dataUrl = '/api/vehicles';
                break;
            case 'drivers':
                mockData = generateMockDrivers();
                dataUrl = '/api/drivers';
                break;
            case 'geofences':
                mockData = generateMockGeofences();
                dataUrl = '/api/geofences';
                break;
        }
        setMethod('POST');
        setUrl(dataUrl);
        setBody(JSON.stringify(mockData, null, 2));
    };
    const handleHistoryClick = (item) => {
        setMethod(item.method);
        setUrl(item.url);
        if (item.body)
            setBody(item.body);
        setResponse({
            status: item.status,
            data: item.response,
        });
    };
    const clearHistory = () => {
        setRequestHistory([]);
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 font-sans", children: "Environnement de test" }), _jsx("p", { className: "mt-2 text-gray-500", children: "Testez l'API Fleet Tracker avant la mise en production" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Configuration" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 mb-2", children: "Environnement" }), _jsx("div", { className: "flex gap-2", children: Object.keys(baseUrls).map((env) => (_jsx("button", { onClick: () => setEnvironment(env), className: cn('px-4 py-2 rounded-lg font-medium transition-colors', environment === env
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'), children: env.charAt(0).toUpperCase() + env.slice(1) }, env))) })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: sandboxMode, onChange: (e) => setSandboxMode(e.target.checked), className: "rounded" }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: "Mode Sandbox" })] }), sandboxMode && (_jsx(Badge, { variant: "secondary", children: "Donn\u00E9es fictives" }))] })] })] }), _jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Testeur de requ\u00EAte" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "px-3 py-2 border border-gray-200 rounded-lg font-medium bg-white", children: [_jsx("option", { children: "GET" }), _jsx("option", { children: "POST" }), _jsx("option", { children: "PUT" }), _jsx("option", { children: "DELETE" })] }), _jsx(Input, { placeholder: "/api/vehicles", value: url, onChange: (e) => setUrl(e.target.value), className: "flex-1" })] }), method !== 'GET' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 mb-2", children: "Body (JSON)" }), _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), placeholder: '{"name": "..."}', className: "w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm h-40 resize-none" })] })), _jsxs(Button, { onClick: handleSendRequest, disabled: loading || !url, className: "w-full", children: [_jsx(Send, { size: 16, className: "mr-2" }), loading ? 'Envoi...' : 'Envoyer la requête'] })] })] }), response && (_jsxs(Card, { className: `rounded-xl shadow-sm ${response.status && response.status >= 200 && response.status < 300
                                    ? 'border-blue-600 bg-white border'
                                    : response.error
                                        ? 'border-red-500 bg-white border'
                                        : 'border-gray-200 bg-white border'}`, children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-base", children: "R\u00E9ponse" }), _jsxs(Badge, { variant: response.status && response.status >= 200 && response.status < 300
                                                        ? 'default'
                                                        : 'destructive', children: [response.status || 'Erreur', " ", response.statusText || ''] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto", children: _jsx("code", { className: "whitespace-pre-wrap break-words", children: JSON.stringify(response.data || response.error || response, null, 2) }) }) })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "G\u00E9n\u00E9rateur de donn\u00E9es" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsx(Button, { variant: "outline", className: "w-full justify-start", onClick: () => handleGenerateMockData('vehicles'), children: "10 V\u00E9hicules" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", onClick: () => handleGenerateMockData('drivers'), children: "5 Conducteurs" }), _jsx(Button, { variant: "outline", className: "w-full justify-start", onClick: () => handleGenerateMockData('geofences'), children: "3 G\u00E9ofences" })] })] }), _jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-base", children: "Historique" }), requestHistory.length > 0 && (_jsx("button", { onClick: clearHistory, className: "p-1 hover:bg-gray-100 rounded", children: _jsx(Trash2, { size: 16 }) }))] }) }), _jsx(CardContent, { className: "space-y-2 max-h-80 overflow-y-auto", children: requestHistory.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500", children: "Aucune requ\u00EAte" })) : (requestHistory.map((item) => (_jsxs("button", { onClick: () => handleHistoryClick(item), className: "w-full text-left p-2 hover:bg-blue-50/50 rounded-lg border border-gray-200 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-1", children: [_jsx(Badge, { variant: getMethodBadgeVariant(item.method), children: item.method }), item.status && (_jsx("span", { className: cn('text-xs font-medium', item.status >= 200 && item.status < 300
                                                                ? 'text-blue-600'
                                                                : 'text-red-500'), children: item.status }))] }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: item.url }), _jsx("p", { className: "text-xs text-gray-500", children: item.timestamp.toLocaleTimeString() })] }, item.id)))) })] }), _jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Documentation" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Besoin d'aide pour les endpoints ?" }), _jsx(Button, { variant: "outline", className: "w-full justify-start text-blue-600 hover:text-blue-600", onClick: () => window.open('/api-docs', '_blank'), children: "Consulter la documentation" }), _jsx(Button, { variant: "outline", className: "w-full justify-start text-blue-600 hover:text-blue-600", onClick: () => window.open('/sdk-examples', '_blank'), children: "Voir les exemples SDK" })] })] })] })] })] }));
}
function getMethodBadgeVariant(method) {
    switch (method) {
        case 'GET':
            return 'default';
        case 'POST':
            return 'secondary';
        case 'PUT':
            return 'outline';
        case 'DELETE':
            return 'destructive';
    }
}
//# sourceMappingURL=TestEnvironmentPage.js.map