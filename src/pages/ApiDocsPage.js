import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
const endpoints = [
    // Véhicules
    {
        method: 'GET',
        path: '/api/vehicles',
        description: 'Récupérer la liste de tous les véhicules',
        category: 'Véhicules',
    },
    {
        method: 'GET',
        path: '/api/vehicles/:id',
        description: 'Récupérer les détails d\'un véhicule',
        category: 'Véhicules',
    },
    {
        method: 'POST',
        path: '/api/vehicles',
        description: 'Créer un nouveau véhicule',
        category: 'Véhicules',
    },
    {
        method: 'PUT',
        path: '/api/vehicles/:id',
        description: 'Mettre à jour un véhicule',
        category: 'Véhicules',
    },
    {
        method: 'DELETE',
        path: '/api/vehicles/:id',
        description: 'Supprimer un véhicule',
        category: 'Véhicules',
    },
    // Conducteurs
    {
        method: 'GET',
        path: '/api/drivers',
        description: 'Récupérer la liste de tous les conducteurs',
        category: 'Conducteurs',
    },
    {
        method: 'GET',
        path: '/api/drivers/:id',
        description: 'Récupérer les détails d\'un conducteur',
        category: 'Conducteurs',
    },
    {
        method: 'POST',
        path: '/api/drivers',
        description: 'Créer un nouveau conducteur',
        category: 'Conducteurs',
    },
    {
        method: 'PUT',
        path: '/api/drivers/:id',
        description: 'Mettre à jour un conducteur',
        category: 'Conducteurs',
    },
    // Géofences
    {
        method: 'GET',
        path: '/api/geofences',
        description: 'Récupérer la liste de tous les géofences',
        category: 'Géofences',
    },
    {
        method: 'POST',
        path: '/api/geofences',
        description: 'Créer un nouveau géofence',
        category: 'Géofences',
    },
    {
        method: 'PUT',
        path: '/api/geofences/:id',
        description: 'Mettre à jour un géofence',
        category: 'Géofences',
    },
    {
        method: 'DELETE',
        path: '/api/geofences/:id',
        description: 'Supprimer un géofence',
        category: 'Géofences',
    },
    // Alertes
    {
        method: 'GET',
        path: '/api/alerts',
        description: 'Récupérer la liste de toutes les alertes',
        category: 'Alertes',
    },
    {
        method: 'GET',
        path: '/api/alerts/:id',
        description: 'Récupérer les détails d\'une alerte',
        category: 'Alertes',
    },
    {
        method: 'POST',
        path: '/api/alerts',
        description: 'Créer une nouvelle alerte',
        category: 'Alertes',
    },
    // GPS
    {
        method: 'GET',
        path: '/api/gps/location/:vehicleId',
        description: 'Récupérer la localisation actuelle d\'un véhicule',
        category: 'GPS',
    },
    {
        method: 'GET',
        path: '/api/gps/history/:vehicleId',
        description: 'Récupérer l\'historique GPS d\'un véhicule',
        category: 'GPS',
    },
];
const categories = Array.from(new Set(endpoints.map((e) => e.category)));
function getMethodColor(method) {
    switch (method) {
        case 'GET':
            return 'default';
        case 'POST':
            return 'secondary';
        case 'PUT':
            return 'outline';
        case 'DELETE':
            return 'destructive';
        default:
            return 'default';
    }
}
function getMethodLabel(method) {
    switch (method) {
        case 'GET':
            return 'Lecture';
        case 'POST':
            return 'Créer';
        case 'PUT':
            return 'Modifier';
        case 'DELETE':
            return 'Supprimer';
        default:
            return method;
    }
}
export default function ApiDocsPage() {
    const [activeTab, setActiveTab] = useState('endpoints');
    const [apiKey, setApiKey] = useState('sk_live_1a2b3c4d5e6f7g8h9i0j');
    const [showKey, setShowKey] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const filteredEndpoints = selectedCategory
        ? endpoints.filter((e) => e.category === selectedCategory)
        : endpoints;
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };
    const generateNewKey = () => {
        const newKey = `sk_live_${Math.random().toString(36).substring(2, 26)}`;
        setApiKey(newKey);
    };
    const revokeKey = () => {
        setApiKey('sk_revoked_' + Date.now());
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Documentation API" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Int\u00E9grez TrackZone dans votre application" })] }), _jsx("div", { className: "flex gap-2 border-b border-gray-200 flex-wrap", children: [
                    { id: 'endpoints', label: 'Endpoints' },
                    { id: 'examples', label: 'Exemples' },
                    { id: 'auth', label: 'Authentification' },
                    { id: 'limits', label: 'Limites' },
                    { id: 'keys', label: 'Clés API' },
                ].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: cn('px-4 py-3 font-medium text-sm border-b-2 transition-colors', activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'), children: tab.label }, tab.id))) }), activeTab === 'endpoints' && (_jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { onClick: () => setSelectedCategory(null), className: cn('px-4 py-2 rounded-lg font-medium transition-colors', selectedCategory === null
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'), children: "Tous" }), categories.map((cat) => (_jsx("button", { onClick: () => setSelectedCategory(cat), className: cn('px-4 py-2 rounded-lg font-medium transition-colors', selectedCategory === cat
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'), children: cat }, cat)))] }) }) }), filteredEndpoints.map((endpoint, idx) => (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Badge, { variant: getMethodColor(endpoint.method), children: getMethodLabel(endpoint.method) }), _jsx("code", { className: "text-sm font-mono bg-gray-100 px-3 py-1 rounded text-gray-900", children: endpoint.path })] }), _jsx("p", { className: "text-gray-600", children: endpoint.description })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => copyToClipboard(endpoint.path), children: [_jsx(Copy, { size: 16, className: "mr-2" }), "Copier"] })] }) }) }, idx)))] })), activeTab === 'examples' && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "R\u00E9cup\u00E9rer les v\u00E9hicules" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "cURL" }), _jsx("div", { className: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { children: `curl -X GET "https://api.trackzone.com/api/vehicles" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"` }) }), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => copyToClipboard(`curl -X GET "https://api.trackzone.com/api/vehicles" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`), children: [_jsx(Copy, { size: 16, className: "mr-2" }), "Copier"] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "JavaScript (fetch)" }), _jsx("div", { className: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { children: `const response = await fetch('https://api.trackzone.com/api/vehicles', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();` }) }), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => copyToClipboard(`const response = await fetch('https://api.trackzone.com/api/vehicles', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`), children: [_jsx(Copy, { size: 16, className: "mr-2" }), "Copier"] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Cr\u00E9er un g\u00E9ofence" }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "JavaScript (fetch)" }), _jsx("div", { className: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { children: `const response = await fetch('https://api.trackzone.com/api/geofences', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Zone de dépôt',
    shape: {
      type: 'circle',
      center: { lat: 48.8566, lng: 2.3522 },
      radiusMeters: 200
    },
    alertOnEntry: true,
    alertOnExit: true
  })
});
const data = await response.json();` }) }), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => copyToClipboard(`const response = await fetch('https://api.trackzone.com/api/geofences', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Zone de dépôt',
    shape: {
      type: 'circle',
      center: { lat: 48.8566, lng: 2.3522 },
      radiusMeters: 200
    },
    alertOnEntry: true,
    alertOnExit: true
  })
});
const data = await response.json();`), children: [_jsx(Copy, { size: 16, className: "mr-2" }), "Copier"] })] }) })] })] })), activeTab === 'auth' && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Authentification par Bearer Token" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Utiliser une cl\u00E9 API" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Incluez votre cl\u00E9 API dans l'en-t\u00EAte Authorization de chaque requ\u00EAte :" }), _jsx("div", { className: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { children: "Authorization: Bearer sk_live_YOUR_KEY_HERE" }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Exemple" }), _jsx("div", { className: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { children: `GET /api/vehicles HTTP/1.1
Host: api.trackzone.com
Authorization: Bearer sk_live_1a2b3c4d5e6f7g8h9i0j
Content-Type: application/json` }) })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 p-4 rounded-lg", children: _jsxs("p", { className: "text-blue-900", children: [_jsx("strong", { children: "S\u00E9curit\u00E9 :" }), " Ne stockez pas vos cl\u00E9s API dans le code source. Utilisez des variables d'environnement."] }) })] })] })), activeTab === 'limits' && (_jsx("div", { className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Limites de taux (Rate Limiting)" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "border border-gray-200 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Plan Starter" }), _jsx("p", { className: "text-3xl font-bold text-blue-600 mb-2", children: "100" }), _jsx("p", { className: "text-gray-600 text-sm", children: "requ\u00EAtes par minute" })] }), _jsxs("div", { className: "border border-gray-200 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Plan Professionnel" }), _jsx("p", { className: "text-3xl font-bold text-blue-600 mb-2", children: "500" }), _jsx("p", { className: "text-gray-600 text-sm", children: "requ\u00EAtes par minute" })] }), _jsxs("div", { className: "border border-gray-200 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Plan Entreprise" }), _jsx("p", { className: "text-3xl font-bold text-blue-600 mb-2", children: "Illimit\u00E9" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Support prioritaire" })] })] }), _jsx("div", { className: "bg-amber-50 border border-amber-200 p-4 rounded-lg", children: _jsxs("p", { className: "text-amber-900", children: [_jsx("strong", { children: "En cas de d\u00E9passement :" }), " Vous recevrez une r\u00E9ponse 429 Too Many Requests. Attendez avant de r\u00E9essayer."] }) })] }) })] }) })), activeTab === 'keys' && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Gestion des cl\u00E9s API" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Cl\u00E9s actives" }), _jsxs("div", { className: "border border-gray-200 rounded-lg p-4 space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("div", { className: "flex items-center gap-3 flex-1", children: _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Production" }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("code", { className: "text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-1", children: showKey ? apiKey : apiKey.substring(0, 10) + '...' }), _jsx("button", { onClick: () => setShowKey(!showKey), className: "p-1 hover:bg-gray-100 rounded", children: showKey ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) }), _jsx("button", { onClick: () => copyToClipboard(apiKey), className: "p-1 hover:bg-gray-100 rounded", children: _jsx(Copy, { size: 16 }) })] })] }) }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: generateNewKey, className: "flex-1", children: [_jsx(RefreshCw, { size: 16, className: "mr-2" }), "G\u00E9n\u00E9rer une nouvelle cl\u00E9"] }), _jsx(Button, { variant: "destructive", onClick: revokeKey, className: "flex-1", children: "R\u00E9voquer" })] })] })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 p-4 rounded-lg", children: _jsxs("p", { className: "text-blue-900", children: [_jsx("strong", { children: "Conseil :" }), " G\u00E9n\u00E9rez une nouvelle cl\u00E9 r\u00E9guli\u00E8rement pour renforcer la s\u00E9curit\u00E9. Les anciennes cl\u00E9s seront d\u00E9sactiv\u00E9es."] }) })] })] }))] }));
}
//# sourceMappingURL=ApiDocsPage.js.map