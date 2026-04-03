import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
const examples = {
    vehicles: {
        title: 'Récupérer les véhicules',
        description: 'Fetchez la liste complète des véhicules de votre flotte',
        snippets: {
            javascript: `const getVehicles = async () => {
  const response = await fetch('https://api.trackzone.com/api/vehicles', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer sk_live_YOUR_KEY',
      'Content-Type': 'application/json'
    }
  });
  const vehicles = await response.json();
  console.log(vehicles);
  return vehicles;
};

getVehicles();`,
            python: `import requests

def get_vehicles():
    headers = {
        'Authorization': 'Bearer sk_live_YOUR_KEY',
        'Content-Type': 'application/json'
    }
    response = requests.get(
        'https://api.trackzone.com/api/vehicles',
        headers=headers
    )
    vehicles = response.json()
    print(vehicles)
    return vehicles

get_vehicles()`,
            php: `<?php
$apiKey = 'sk_live_YOUR_KEY';
$url = 'https://api.trackzone.com/api/vehicles';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$vehicles = json_decode($response, true);
print_r($vehicles);

curl_close($ch);
?>`,
            curl: `curl -X GET "https://api.trackzone.com/api/vehicles" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json"`,
        },
    },
    geofence: {
        title: 'Créer un géofence',
        description: 'Créez une nouvelle zone de contrôle pour vos véhicules',
        snippets: {
            javascript: `const createGeofence = async () => {
  const response = await fetch('https://api.trackzone.com/api/geofences', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_YOUR_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Zone de dépôt',
      description: 'Dépôt principal',
      shape: {
        type: 'circle',
        center: { lat: 48.8566, lng: 2.3522 },
        radiusMeters: 200
      },
      alertOnEntry: true,
      alertOnExit: true
    })
  });
  const geofence = await response.json();
  console.log('Geofence créé:', geofence);
  return geofence;
};

createGeofence();`,
            python: `import requests
import json

def create_geofence():
    headers = {
        'Authorization': 'Bearer sk_live_YOUR_KEY',
        'Content-Type': 'application/json'
    }

    payload = {
        'name': 'Zone de dépôt',
        'description': 'Dépôt principal',
        'shape': {
            'type': 'circle',
            'center': {'lat': 48.8566, 'lng': 2.3522},
            'radiusMeters': 200
        },
        'alertOnEntry': True,
        'alertOnExit': True
    }

    response = requests.post(
        'https://api.trackzone.com/api/geofences',
        headers=headers,
        json=payload
    )

    geofence = response.json()
    print('Geofence créé:', geofence)
    return geofence

create_geofence()`,
            php: `<?php
$apiKey = 'sk_live_YOUR_KEY';
$url = 'https://api.trackzone.com/api/geofences';

$payload = array(
    'name' => 'Zone de dépôt',
    'description' => 'Dépôt principal',
    'shape' => array(
        'type' => 'circle',
        'center' => array('lat' => 48.8566, 'lng' => 2.3522),
        'radiusMeters' => 200
    ),
    'alertOnEntry' => true,
    'alertOnExit' => true
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$geofence = json_decode($response, true);
echo "Geofence créé: ";
print_r($geofence);

curl_close($ch);
?>`,
            curl: `curl -X POST "https://api.trackzone.com/api/geofences" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Zone de dépôt",
    "description": "Dépôt principal",
    "shape": {
      "type": "circle",
      "center": { "lat": 48.8566, "lng": 2.3522 },
      "radiusMeters": 200
    },
    "alertOnEntry": true,
    "alertOnExit": true
  }'`,
        },
    },
    alerts: {
        title: 'S\'abonner aux alertes',
        description: 'Recevez les notifications en temps réel via WebSocket',
        snippets: {
            javascript: `const subscribeToAlerts = () => {
  const ws = new WebSocket(
    'wss://api.trackzone.com/ws/alerts?token=sk_live_YOUR_KEY'
  );

  ws.onopen = () => {
    console.log('Connecté aux alertes');
  };

  ws.onmessage = (event) => {
    const alert = JSON.parse(event.data);
    console.log('Nouvelle alerte:', alert);
    // Traitez l'alerte ici
    if (alert.type === 'geofence_entry') {
      console.log(\`Véhicule entré dans zone: \${alert.geofenceName}\`);
    } else if (alert.type === 'geofence_exit') {
      console.log(\`Véhicule sorti de zone: \${alert.geofenceName}\`);
    }
  };

  ws.onerror = (error) => {
    console.error('Erreur WebSocket:', error);
  };

  ws.onclose = () => {
    console.log('Déconnecté des alertes');
  };
};

subscribeToAlerts();`,
            python: `import websocket
import json
import threading

def on_message(ws, message):
    alert = json.loads(message)
    print('Nouvelle alerte:', alert)
    if alert['type'] == 'geofence_entry':
        print(f"Véhicule entré dans zone: {alert['geofenceName']}")
    elif alert['type'] == 'geofence_exit':
        print(f"Véhicule sorti de zone: {alert['geofenceName']}")

def on_error(ws, error):
    print(f'Erreur: {error}')

def on_close(ws, close_status_code, close_msg):
    print('Déconnecté des alertes')

def on_open(ws):
    print('Connecté aux alertes')

def subscribe_to_alerts():
    ws = websocket.WebSocketApp(
        'wss://api.trackzone.com/ws/alerts?token=sk_live_YOUR_KEY',
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()

subscribe_to_alerts()`,
            php: `<?php
require_once 'vendor/autoload.php';

use WebSocket\\Client\\WebSocket;

$ws = new WebSocket('wss://api.trackzone.com/ws/alerts?token=sk_live_YOUR_KEY');

$ws->onopen = function(WebSocket\\Connection $connection) {
    echo "Connecté aux alertes\\n";
};

$ws->onmessage = function(WebSocket\\Connection $connection, $message) {
    $alert = json_decode($message, true);
    echo "Nouvelle alerte: ";
    print_r($alert);

    if ($alert['type'] === 'geofence_entry') {
        echo "Véhicule entré dans zone: " . $alert['geofenceName'] . "\\n";
    } elseif ($alert['type'] === 'geofence_exit') {
        echo "Véhicule sorti de zone: " . $alert['geofenceName'] . "\\n";
    }
};

$ws->onerror = function(WebSocket\\Connection $connection, Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\\n";
};

$ws->onclose = function(WebSocket\\Connection $connection) {
    echo "Déconnecté des alertes\\n";
};

$ws->run();
?>`,
            curl: `# WebSocket n'est pas supporté directement avec curl
# Utilisez plutôt JavaScript, Python ou PHP`,
        },
    },
    history: {
        title: 'Récupérer l\'historique GPS',
        description: 'Obtenez les positions historiques d\'un véhicule',
        snippets: {
            javascript: `const getGpsHistory = async (vehicleId, startDate, endDate) => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: 1000
  });

  const response = await fetch(
    \`https://api.trackzone.com/api/gps/history/\${vehicleId}?\${params}\`,
    {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer sk_live_YOUR_KEY',
        'Content-Type': 'application/json'
      }
    }
  );

  const history = await response.json();
  console.log(\`Historique de \${history.length} positions\`);
  return history;
};

// Exemple: 7 derniers jours
const endDate = new Date();
const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
getGpsHistory('vehicle-123', startDate, endDate);`,
            python: `from datetime import datetime, timedelta
import requests

def get_gps_history(vehicle_id, start_date, end_date):
    headers = {
        'Authorization': 'Bearer sk_live_YOUR_KEY',
        'Content-Type': 'application/json'
    }

    params = {
        'startDate': start_date.isoformat(),
        'endDate': end_date.isoformat(),
        'limit': 1000
    }

    response = requests.get(
        f'https://api.trackzone.com/api/gps/history/{vehicle_id}',
        headers=headers,
        params=params
    )

    history = response.json()
    print(f"Historique de {len(history)} positions")
    return history

# Exemple: 7 derniers jours
end_date = datetime.now()
start_date = end_date - timedelta(days=7)
get_gps_history('vehicle-123', start_date, end_date)`,
            php: `<?php
$apiKey = 'sk_live_YOUR_KEY';
$vehicleId = 'vehicle-123';

$endDate = new DateTime();
$startDate = new DateTime('-7 days');

$params = array(
    'startDate' => $startDate->format('c'),
    'endDate' => $endDate->format('c'),
    'limit' => 1000
);

$url = 'https://api.trackzone.com/api/gps/history/' . $vehicleId;
$url .= '?' . http_build_query($params);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$history = json_decode($response, true);
echo "Historique de " . count($history) . " positions\\n";
print_r($history);

curl_close($ch);
?>`,
            curl: `curl -X GET "https://api.trackzone.com/api/gps/history/vehicle-123" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -G \\
  -d "startDate=2024-01-01T00:00:00Z" \\
  -d "endDate=2024-01-08T00:00:00Z" \\
  -d "limit=1000"`,
        },
    },
};
const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP' },
    { id: 'curl', label: 'cURL' },
];
export default function SdkExamplesPage() {
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [selectedExample, setSelectedExample] = useState('vehicles');
    const [copiedSnippet, setCopiedSnippet] = useState(null);
    const currentExample = examples[selectedExample];
    const currentCode = currentExample.snippets[selectedLanguage];
    const copyToClipboard = (code, snippetId) => {
        navigator.clipboard.writeText(code);
        setCopiedSnippet(snippetId);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };
    return (_jsxs("div", { className: "space-y-6 bg-[#0A0A0F] min-h-screen p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Exemples SDK" }), _jsx("p", { className: "mt-2 text-[#6B6B80]", children: "Int\u00E9grez l'API TrackZone avec votre langage pr\u00E9f\u00E9r\u00E9" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [_jsx("div", { className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Exemples" }) }), _jsx(CardContent, { className: "space-y-2", children: Object.keys(examples).map((example) => (_jsx("button", { onClick: () => setSelectedExample(example), className: cn('w-full text-left px-4 py-2 rounded-lg transition-colors', selectedExample === example
                                            ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                                            : 'hover:bg-[#0A0A0F]'), children: examples[example].title }, example))) })] }) }), _jsxs("div", { className: "lg:col-span-3 space-y-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx("div", { className: "flex gap-2 flex-wrap", children: languages.map((lang) => (_jsx("button", { onClick: () => setSelectedLanguage(lang.id), className: cn('px-4 py-2 rounded-lg font-medium transition-colors', selectedLanguage === lang.id
                                                ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                                                : 'bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#2A2A3D]'), children: lang.label }, lang.id))) }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: currentExample.title }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-2", children: currentExample.description })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => copyToClipboard(currentCode, selectedExample), className: "ml-2", children: copiedSnippet === selectedExample ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16, className: "mr-2" }), "Copi\u00E9"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { size: 16, className: "mr-2" }), "Copier"] })) })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "bg-[#0A0A0F] text-[#00E5CC] p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { className: "whitespace-pre-wrap break-words", children: currentCode }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Configuration des Webhooks" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-[#6B6B80]", children: "Recevez des notifications en temps r\u00E9el pour les \u00E9v\u00E9nements de votre flotte." }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-[#F0F0F5] mb-2", children: "Types d'\u00E9v\u00E9nements" }), _jsxs("ul", { className: "space-y-2 text-sm text-[#6B6B80]", children: [_jsxs("li", { children: [_jsx("code", { className: "bg-[#0A0A0F] px-2 py-1 rounded", children: "geofence.entered" }), "- V\u00E9hicule entr\u00E9 dans une zone"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-[#0A0A0F] px-2 py-1 rounded", children: "geofence.exited" }), "- V\u00E9hicule sorti d'une zone"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-[#0A0A0F] px-2 py-1 rounded", children: "alert.triggered" }), "- Alerte d\u00E9clench\u00E9e"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-[#0A0A0F] px-2 py-1 rounded", children: "vehicle.offline" }), "- V\u00E9hicule hors ligne"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-[#0A0A0F] px-2 py-1 rounded", children: "gps.update" }), "- Mise \u00E0 jour GPS re\u00E7ue"] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-[#F0F0F5] mb-2", children: "Exemple de payload" }), _jsx("div", { className: "bg-[#0A0A0F] text-[#00E5CC] p-4 rounded-lg font-mono text-sm overflow-x-auto", children: _jsx("code", { children: `{
  "id": "webhook_123",
  "type": "geofence.entered",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "vehicleId": "vehicle-456",
    "vehicleName": "Camion 01",
    "geofenceId": "geofence-789",
    "geofenceName": "Zone de dépôt",
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}` }) })] })] })] })] })] })] }));
}
//# sourceMappingURL=SdkExamplesPage.js.map