'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Play,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';

type CalculationMethod = 'gps' | 'odometer' | 'hybrid';

interface RecalculationResult {
  id: string;
  period: string;
  distanceGps: number;
  distanceOdometer: number;
  consumedDeclared: number;
  consumedRecalculated: number;
  gap: number;
}

interface RecalculationHistory {
  id: string;
  date: string;
  vehicle: string;
  method: CalculationMethod;
  status: 'completed' | 'in_progress' | 'failed';
}

interface SummaryMetrics {
  avgConsumption: number;
  avgGap: number;
  anomaliesDetected: number;
}

export default function FuelRecalculationPage() {
  const [selectedVehicle, setSelectedVehicle] = useState('vehicle-001');
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2026-05-06');
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('hybrid');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const vehicles = [
    { id: 'vehicle-001', name: 'Renault Master - AB-123-CD' },
    { id: 'vehicle-002', name: 'Mercedes Sprinter - EF-456-GH' },
    { id: 'vehicle-003', name: 'Iveco Daily - IJ-789-KL' },
  ];

  const mockResults: RecalculationResult[] = [
    {
      id: '1',
      period: '01-30 nov 2025',
      distanceGps: 2145.3,
      distanceOdometer: 2138.5,
      consumedDeclared: 512.4,
      consumedRecalculated: 498.2,
      gap: -2.77,
    },
    {
      id: '2',
      period: '01-31 déc 2025',
      distanceGps: 1987.6,
      distanceOdometer: 2015.3,
      consumedDeclared: 487.2,
      consumedRecalculated: 521.8,
      gap: 7.11,
    },
    {
      id: '3',
      period: '01-31 jan 2026',
      distanceGps: 2234.1,
      distanceOdometer: 2198.8,
      consumedDeclared: 534.5,
      consumedRecalculated: 545.3,
      gap: 2.02,
    },
    {
      id: '4',
      period: '01-28 fév 2026',
      distanceGps: 2056.7,
      distanceOdometer: 2089.2,
      consumedDeclared: 495.3,
      consumedRecalculated: 517.4,
      gap: 4.45,
    },
    {
      id: '5',
      period: '01-31 mar 2026',
      distanceGps: 2378.4,
      distanceOdometer: 2412.6,
      consumedDeclared: 578.2,
      consumedRecalculated: 612.1,
      gap: 5.85,
    },
    {
      id: '6',
      period: '01-30 avr 2026',
      distanceGps: 2123.5,
      distanceOdometer: 2156.3,
      consumedDeclared: 512.6,
      consumedRecalculated: 534.7,
      gap: 4.31,
    },
  ];

  const mockHistory: RecalculationHistory[] = [
    {
      id: '1',
      date: '2026-05-05 14:32',
      vehicle: 'Renault Master - AB-123-CD',
      method: 'gps',
      status: 'completed',
    },
    {
      id: '2',
      date: '2026-05-03 09:15',
      vehicle: 'Mercedes Sprinter - EF-456-GH',
      method: 'hybrid',
      status: 'completed',
    },
    {
      id: '3',
      date: '2026-05-01 16:45',
      vehicle: 'Iveco Daily - IJ-789-KL',
      method: 'odometer',
      status: 'completed',
    },
    {
      id: '4',
      date: '2026-04-28 10:20',
      vehicle: 'Renault Master - AB-123-CD',
      method: 'hybrid',
      status: 'failed',
    },
  ];

  const calculateSummary = (): SummaryMetrics => {
    const totalConsumption = mockResults.reduce(
      (sum, r) => sum + r.consumedRecalculated,
      0
    );
    const totalGap = mockResults.reduce((sum, r) => sum + Math.abs(r.gap), 0);
    const anomalies = mockResults.filter(
      (r) => Math.abs(r.gap) > 5
    ).length;

    return {
      avgConsumption: totalConsumption / mockResults.length,
      avgGap: totalGap / mockResults.length,
      anomaliesDetected: anomalies,
    };
  };

  const handleRecalculate = () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    setShowResults(false);

    const interval = setInterval(() => {
      setCalculationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsCalculating(false);
            setShowResults(true);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
  };

  const handleExport = () => {
    console.log('Exporting results...');
  };

  const summary = calculateSummary();

  const methodLabels: Record<CalculationMethod, string> = {
    gps: 'GPS',
    odometer: 'Odomètre',
    hybrid: 'Hybride (GPS + Odomètre)',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Recalcul de consommation carburant
            </h1>
            <p className="text-gray-600 mt-1">
              Recalculez la consommation basée sur les données GPS ou odomètre corrigées
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Configuration du recalcul
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Vehicle Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Véhicule
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Calculation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Méthode de calcul
              </label>
              <select
                value={calculationMethod}
                onChange={(e) =>
                  setCalculationMethod(e.target.value as CalculationMethod)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gps">GPS</option>
                <option value="odometer">Odomètre</option>
                <option value="hybrid">Hybride (GPS + Odomètre)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="mt-6 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Play className={`h-5 w-5 ${isCalculating ? 'animate-spin' : ''}`} />
            Lancer le recalcul
          </button>

          {/* Progress Bar */}
          {isCalculating && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  Recalcul en cours...
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(calculationProgress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${calculationProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {showResults && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Consommation moyenne
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {summary.avgConsumption.toFixed(1)}L
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Écart moyen
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {summary.avgGap.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Anomalies détectées
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {summary.anomaliesDetected}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Résultats du recalcul
                </h2>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                >
                  <Download className="h-5 w-5" />
                  Exporter
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Distance GPS (km)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Distance odomètre (km)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Consommation déclarée (L)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Consommation recalculée (L)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Écart
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockResults.map((result) => (
                      <tr
                        key={result.id}
                        className={`hover:bg-gray-50 transition ${
                          Math.abs(result.gap) > 5 ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {result.period}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {result.distanceGps.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {result.distanceOdometer.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {result.consumedDeclared.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {result.consumedRecalculated.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${
                              result.gap > 5
                                ? 'bg-red-100 text-red-700'
                                : result.gap < -5
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {result.gap > 0 ? '+' : ''}
                            {result.gap.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Historique des recalculs
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {mockHistory.map((item) => (
              <div
                key={item.id}
                className="p-6 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {item.vehicle}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-600">
                      {item.date}
                    </span>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {methodLabels[item.method]}
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.status === 'completed'
                      ? 'Terminé'
                      : item.status === 'in_progress'
                        ? 'En cours'
                        : 'Échec'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
