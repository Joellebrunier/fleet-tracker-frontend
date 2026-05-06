import React, { useState } from 'react';
import {
  Download,
  TrendingUp,
  Leaf,
  AlertCircle,
  BarChart3,
  Target,
} from 'lucide-react';

type PeriodType = 'month' | 'quarter' | 'year';

interface KPICard {
  label: string;
  value: string;
  unit: string;
  trend?: number;
  icon: React.ReactNode;
}

interface EmissionsByVehicleType {
  type: string;
  emissions: number;
  color: string;
  percentage: number;
}

interface MonthlyEmission {
  month: string;
  emissions: number;
}

interface Vehicle {
  id: string;
  name: string;
  fuelType: string;
  distance: number;
  consumption: number;
  co2: number;
  score: number;
}

interface Driver {
  id: string;
  name: string;
  ecodrivingScore: number;
  trips: number;
}

interface EnvironmentalObjective {
  label: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
}

const CSRDPage: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('month');

  // Mock KPI data
  const kpiData: KPICard[] = [
    {
      label: 'Émissions CO2 totales',
      value: '1,245',
      unit: 'tonnes',
      trend: -8.5,
      icon: <Leaf className="w-8 h-8 text-green-600" />,
    },
    {
      label: 'Consommation carburant',
      value: '58,420',
      unit: 'litres',
      trend: -5.2,
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
    },
    {
      label: 'Distance totale',
      value: '156,780',
      unit: 'km',
      trend: 2.1,
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
    },
    {
      label: 'Score environnemental',
      value: '78',
      unit: '/100',
      trend: 12.3,
      icon: <Target className="w-8 h-8 text-orange-600" />,
    },
  ];

  // Mock emissions by vehicle type
  const emissionsByType: EmissionsByVehicleType[] = [
    {
      type: 'Diesel',
      emissions: 485,
      color: 'bg-red-500',
      percentage: 39,
    },
    {
      type: 'Essence',
      emissions: 380,
      color: 'bg-orange-500',
      percentage: 30,
    },
    {
      type: 'Hybride',
      emissions: 220,
      color: 'bg-yellow-500',
      percentage: 18,
    },
    {
      type: 'Électrique',
      emissions: 160,
      color: 'bg-green-500',
      percentage: 13,
    },
  ];

  // Mock monthly emissions
  const monthlyEmissions: MonthlyEmission[] = [
    { month: 'Janvier', emissions: 1100 },
    { month: 'Février', emissions: 1050 },
    { month: 'Mars', emissions: 1200 },
    { month: 'Avril', emissions: 1180 },
    { month: 'Mai', emissions: 1120 },
    { month: 'Juin', emissions: 1080 },
  ];

  // Mock vehicle data
  const vehicles: Vehicle[] = [
    {
      id: 'V001',
      name: 'Mercedes Sprinter 1',
      fuelType: 'Diesel',
      distance: 12450,
      consumption: 45.2,
      co2: 118.5,
      score: 82,
    },
    {
      id: 'V002',
      name: 'Renault Master 2',
      fuelType: 'Diesel',
      distance: 11200,
      consumption: 42.8,
      co2: 112.3,
      score: 85,
    },
    {
      id: 'V003',
      name: 'Ford Transit 3',
      fuelType: 'Diesel',
      distance: 10800,
      consumption: 39.5,
      co2: 103.4,
      score: 88,
    },
    {
      id: 'V004',
      name: 'Citroën C3 4',
      fuelType: 'Essence',
      distance: 9500,
      consumption: 32.1,
      co2: 92.8,
      score: 75,
    },
    {
      id: 'V005',
      name: 'Peugeot 308 5',
      fuelType: 'Essence',
      distance: 8900,
      consumption: 29.4,
      co2: 85.2,
      score: 78,
    },
    {
      id: 'V006',
      name: 'Toyota Yaris 6',
      fuelType: 'Hybride',
      distance: 7600,
      consumption: 18.5,
      co2: 48.7,
      score: 92,
    },
    {
      id: 'V007',
      name: 'Nissan Leaf 7',
      fuelType: 'Électrique',
      distance: 6200,
      consumption: 0,
      co2: 0,
      score: 98,
    },
    {
      id: 'V008',
      name: 'BMW i3 8',
      fuelType: 'Électrique',
      distance: 5800,
      consumption: 0,
      co2: 0,
      score: 97,
    },
  ];

  // Mock driver ecodriving scores
  const drivers: Driver[] = [
    { id: 'D001', name: 'Jean Dupont', ecodrivingScore: 92, trips: 145 },
    { id: 'D002', name: 'Marie Martin', ecodrivingScore: 88, trips: 128 },
    { id: 'D003', name: 'Pierre Bernard', ecodrivingScore: 81, trips: 156 },
    { id: 'D004', name: 'Sophie Leclerc', ecodrivingScore: 85, trips: 134 },
    { id: 'D005', name: 'Luc Arnould', ecodrivingScore: 78, trips: 142 },
    { id: 'D006', name: 'Isabelle Moreau', ecodrivingScore: 91, trips: 138 },
  ];

  // Mock environmental objectives
  const objectives: EnvironmentalObjective[] = [
    {
      label: 'Réduction CO2',
      target: 30,
      current: 18,
      unit: '%',
      deadline: '2026-12-31',
    },
    {
      label: 'Électrification flotte',
      target: 40,
      current: 25,
      unit: '%',
      deadline: '2027-06-30',
    },
    {
      label: 'Score moyen flotte',
      target: 85,
      current: 78,
      unit: '/100',
      deadline: '2026-12-31',
    },
  ];

  const maxEmissions = Math.max(...monthlyEmissions.map((e) => e.emissions));

  const handleExportCSRD = () => {
    alert('Rapport CSRD en cours de génération...');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Durabilité & Reporting CSRD
          </h1>
          <p className="text-gray-600">
            Suivi des indicateurs environnementaux et rapports réglementaires
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p === 'month'
                ? 'Mois'
                : p === 'quarter'
                  ? 'Trimestre'
                  : 'Année'}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>{kpi.icon}</div>
                {kpi.trend !== undefined && (
                  <span
                    className={`text-sm font-semibold ${
                      kpi.trend > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {kpi.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {kpi.value}
              </p>
              <p className="text-gray-500 text-sm">{kpi.unit}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Emissions by Vehicle Type */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Émissions par type de carburant
            </h2>
            <div className="space-y-3">
              {emissionsByType.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.emissions} tonnes ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Emissions Trend */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tendance mensuelle des émissions
            </h2>
            <div className="flex items-end justify-between h-64 gap-2">
              {monthlyEmissions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors"
                    style={{
                      height: `${(item.emissions / maxEmissions) * 200}px`,
                    }}
                  />
                  <span className="text-xs font-medium text-gray-600 text-center">
                    {item.month.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle Rankings Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Classement des véhicules par émissions CO2
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Véhicule
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Carburant
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Distance (km)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Consommation (L)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    CO2 (g/km)
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {vehicle.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.fuelType}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {vehicle.distance.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {vehicle.consumption.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          vehicle.co2 === 0
                            ? 'bg-green-100 text-green-700'
                            : vehicle.co2 < 100
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {vehicle.co2}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(vehicle.score / 100) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="ml-2 font-semibold text-gray-700">
                          {vehicle.score}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Eco-Driving Scores */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Score d'écoconduite par conducteur
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Conducteur
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Score d'écoconduite
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Trajets
                  </th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {driver.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              driver.ecodrivingScore >= 90
                                ? 'bg-green-500'
                                : driver.ecodrivingScore >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                            }`}
                            style={{
                              width: `${(driver.ecodrivingScore / 100) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-10">
                          {driver.ecodrivingScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {driver.trips}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Environmental Objectives */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Objectifs environnementaux
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {objectives.map((obj, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {obj.current >= obj.target * 0.8 ? (
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <h3 className="font-semibold text-gray-900">{obj.label}</h3>
                </div>
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${Math.min((obj.current / obj.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>
                    {obj.current} / {obj.target} {obj.unit}
                  </span>
                  <span className="font-medium">
                    {Math.round((obj.current / obj.target) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Échéance: {new Date(obj.deadline).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Exporter le rapport CSRD
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Générez un rapport complet conforme à la directive CSRD
              </p>
            </div>
            <button
              onClick={handleExportCSRD}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSRDPage;
