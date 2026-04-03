import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Language = 'javascript' | 'python' | 'php' | 'curl'
type Example = 'vehicles' | 'geofence' | 'alerts' | 'history'

interface CodeSnippet {
  language: Language
  code: string
}

interface ExampleConfig {
  title: string
  description: string
  snippets: Record<Language, string>
}

const examples: Record<Example, ExampleConfig> = {
  vehicles: {
    title: 'Récupérer les véhicules',
    description: 'Fetchez la liste complète des véhicules de votre flotte',
    snippets: {
      javascript: `const getVehicles = async () => {
  const response = await fetch('https://api.fleet-tracker.com/api/vehicles', {
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
        'https://api.fleet-tracker.com/api/vehicles',
        headers=headers
    )
    vehicles = response.json()
    print(vehicles)
    return vehicles

get_vehicles()`,
      php: `<?php
$apiKey = 'sk_live_YOUR_KEY';
$url = 'https://api.fleet-tracker.com/api/vehicles';

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
      curl: `curl -X GET "https://api.fleet-tracker.com/api/vehicles" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json"`,
    },
  },
  geofence: {
    title: 'Créer un géofence',
    description: 'Créez une nouvelle zone de contrôle pour vos véhicules',
    snippets: {
      javascript: `const createGeofence = async () => {
  const response = await fetch('https://api.fleet-tracker.com/api/geofences', {
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
        'https://api.fleet-tracker.com/api/geofences',
        headers=headers,
        json=payload
    )

    geofence = response.json()
    print('Geofence créé:', geofence)
    return geofence

create_geofence()`,
      php: `<?php
$apiKey = 'sk_live_YOUR_KEY';
$url = 'https://api.fleet-tracker.com/api/geofences';

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
      curl: `curl -X POST "https://api.fleet-tracker.com/api/geofences" \\
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
    'wss://api.fleet-tracker.com/ws/alerts?token=sk_live_YOUR_KEY'
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
        'wss://api.fleet-tracker.com/ws/alerts?token=sk_live_YOUR_KEY',
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

$ws = new WebSocket('wss://api.fleet-tracker.com/ws/alerts?token=sk_live_YOUR_KEY');

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
    \`https://api.fleet-tracker.com/api/gps/history/\${vehicleId}?\${params}\`,
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
        f'https://api.fleet-tracker.com/api/gps/history/{vehicle_id}',
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

$url = 'https://api.fleet-tracker.com/api/gps/history/' . $vehicleId;
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
      curl: `curl -X GET "https://api.fleet-tracker.com/api/gps/history/vehicle-123" \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -G \\
  -d "startDate=2024-01-01T00:00:00Z" \\
  -d "endDate=2024-01-08T00:00:00Z" \\
  -d "limit=1000"`,
    },
  },
}

const languages: { id: Language; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'curl', label: 'cURL' },
]

export default function SdkExamplesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    'javascript'
  )
  const [selectedExample, setSelectedExample] = useState<Example>('vehicles')
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const currentExample = examples[selectedExample]
  const currentCode = currentExample.snippets[selectedLanguage]

  const copyToClipboard = (code: string, snippetId: string) => {
    navigator.clipboard.writeText(code)
    setCopiedSnippet(snippetId)
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

  return (
    <div className="space-y-6 bg-[#0A0A0F] min-h-screen p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Exemples SDK</h1>
        <p className="mt-2 text-[#6B6B80]">
          Intégrez l'API Fleet Tracker avec votre langage préféré
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exemples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(examples) as Example[]).map((example) => (
                <button
                  key={example}
                  onClick={() => setSelectedExample(example)}
                  className={cn(
                    'w-full text-left px-4 py-2 rounded-lg transition-colors',
                    selectedExample === example
                      ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                      : 'hover:bg-[#0A0A0F]'
                  )}
                >
                  {examples[example].title}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Language Tabs */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      selectedLanguage === lang.id
                        ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                        : 'bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#2A2A3D]'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Example */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{currentExample.title}</CardTitle>
                  <p className="text-sm text-[#6B6B80] mt-2">
                    {currentExample.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(currentCode, selectedExample)
                  }
                  className="ml-2"
                >
                  {copiedSnippet === selectedExample ? (
                    <>
                      <Check size={16} className="mr-2" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-2" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0A0A0F] text-[#00E5CC] p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code className="whitespace-pre-wrap break-words">
                  {currentCode}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration des Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#6B6B80]">
                Recevez des notifications en temps réel pour les événements de votre
                flotte.
              </p>
              <div>
                <h3 className="font-semibold text-[#F0F0F5] mb-2">
                  Types d'événements
                </h3>
                <ul className="space-y-2 text-sm text-[#6B6B80]">
                  <li>
                    <code className="bg-[#0A0A0F] px-2 py-1 rounded">
                      geofence.entered
                    </code>
                    - Véhicule entré dans une zone
                  </li>
                  <li>
                    <code className="bg-[#0A0A0F] px-2 py-1 rounded">
                      geofence.exited
                    </code>
                    - Véhicule sorti d'une zone
                  </li>
                  <li>
                    <code className="bg-[#0A0A0F] px-2 py-1 rounded">
                      alert.triggered
                    </code>
                    - Alerte déclenchée
                  </li>
                  <li>
                    <code className="bg-[#0A0A0F] px-2 py-1 rounded">
                      vehicle.offline
                    </code>
                    - Véhicule hors ligne
                  </li>
                  <li>
                    <code className="bg-[#0A0A0F] px-2 py-1 rounded">
                      gps.update
                    </code>
                    - Mise à jour GPS reçue
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#F0F0F5] mb-2">
                  Exemple de payload
                </h3>
                <div className="bg-[#0A0A0F] text-[#00E5CC] p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`{
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
}`}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
