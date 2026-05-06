import React, { useState } from 'react';
import {
  Download,
  FileJson,
  FileText,
  Filter,
  TrendingDown,
} from 'lucide-react';

type PeriodFilterType = 'month' | 'quarter' | 'year';
type VehicleGroupType = 'all' | 'diesel' | 'essence' | 'hybride' | 'electric';
type CostCategoryType = 'all' | 'fuel' | 'maintenance' | 'insurance' | 'fines' | 'tolls';

interface KPICard {
  label: string;
  value: string;
  unit: string;
  trend?: number;
  icon: React.ReactNode;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MonthlyCost {
  month: string;
  fuel: number;
  maintenance: number;
  insurance: number;
  fines: number;
  tolls: number;
  total: number;
}

interface VehicleTCO {
  id: string;
  name: string;
  fuelType: string;
  purchase: number;
  fuel: number;
  maintenance: number;
  insurance: number;
  fines: number;
  total: number;
  distance: number;
}

const AccountingPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('month');
  const [vehicleGroupFilter, setVehicleGroupFilter] = useState<VehicleGroupType>('all');
  const [costCategoryFilter, setCostCategoryFilter] = useState<CostCategoryType>('all');

  // Mock KPI data
  const kpiData: KPICard[] = [
    {
      label: 'Coût total flotte',
      value: '456,320',
      unit: '€',
      trend: -3.2,
      icon: <TrendingDown className="w-8 h-8 text-red-600" />,
    },
    {
      label: 'Coût carburant',
      value: '145,680',
      unit: '€',
      trend: -8.5,
      icon: <FileJson className="w-8 h-8 text-orange-600" />,
    },
    {
      label: 'Coût maintenance',
      value: '89,420',
      unit: '€',
      trend: 2.1,
      icon: <FileText className="w-8 h-8 text-blue-600" />,
    },
    {
      label: 'Coût assurance',
      value: '78,950',
      unit: '€',
      trend: 0.8,
      icon: <Filter className="w-8 h-8 text-purple-600" />,
    },
    {
      label: 'Coût/km moyen',
      value: '2.45',
      unit: '€',
      trend: -5.3,
      icon: <TrendingDown className="w-8 h-8 text-green-600" />,
    },
  ];

  // Mock cost breakdown
  const costBreakdown: CostBreakdown[] = [
    {
      category: 'Carburant',
      amount: 145680,
      percentage: 32,
      color: 'bg-orange-500',
    },
    {
      category: 'Achat/Leasing',
      amount: 125000,
      percentage: 27,
      color: 'bg-blue-500',
    },
    {
      category: 'Maintenance',
      amount: 89420,
      percentage: 20,
      color: 'bg-red-500',
    },
    {
      category: 'Assurance',
      amount: 78950,
      percentage: 17,
      color: 'bg-yellow-500',
    },
    {
      category: 'Amendes & Péages',
      amount: 17270,
      percentage: 4,
      color: 'bg-gray-500',
    },
  ];

  // Mock monthly cost data (12 months)
  const monthlyCosts: MonthlyCost[] = [
    {
      month: 'Janvier',
      fuel: 12100,
      maintenance: 7200,
      insurance: 6580,
      fines: 850,
      tolls: 1420,
      total: 28150,
    },
    {
      month: 'Février',
      fuel: 11850,
      maintenance: 7500,
      insurance: 6580,
      fines: 620,
      tolls: 1350,
      total: 27900,
    },
    {
      month: 'Mars',
      fuel: 12450,
      maintenance: 6800,
      insurance: 6580,
      fines: 920,
      tolls: 1480,
      total: 28230,
    },
    {
      month: 'Avril',
      fuel: 11900,
      maintenance: 7800,
      insurance: 6580,
      fines: 750,
      tolls: 1320,
      total: 28350,
    },
    {
      month: 'Mai',
      fuel: 12300,
      maintenance: 7100,
      insurance: 6580,
      fines: 1050,
      tolls: 1450,
      total: 28480,
    },
    {
      month: 'Juin',
      fuel: 12050,
      maintenance: 7400,
      insurance: 6580,
      fines: 680,
      tolls: 1280,
      total: 27990,
    },
    {
      month: 'Juillet',
      fuel: 12600,
      maintenance: 7300,
      insurance: 6580,
      fines: 920,
      tolls: 1550,
      total: 28950,
    },
    {
      month: 'Août',
      fuel: 12200,
      maintenance: 7600,
      insurance: 6580,
      fines: 780,
      tolls: 1410,
      total: 28570,
    },
    {
      month: 'Septembre',
      fuel: 12450,
      maintenance: 7100,
      insurance: 6580,
      fines: 890,
      tolls: 1380,
      total: 28400,
    },
    {
      month: 'Octobre',
      fuel: 12100,
      maintenance: 7500,
      insurance: 6580,
      fines: 920,
      tolls: 1450,
      total: 28550,
    },
    {
      month: 'Novembre',
      fuel: 11950,
      maintenance: 7300,
      insurance: 6580,
      fines: 750,
      tolls: 1320,
      total: 27900,
    },
    {
      month: 'Décembre',
      fuel: 12050,
      maintenance: 7600,
      insurance: 6580,
      fines: 1100,
      tolls: 1480,
      total: 28810,
    },
  ];

  // Mock vehicle TCO data
  const vehicleTCO: VehicleTCO[] = [
    {
      id: 'V001',
      name: 'Mercedes Sprinter 1',
      fuelType: 'Diesel',
      purchase: 45000,
      fuel: 8200,
      maintenance: 3500,
      insurance: 1850,
      fines: 280,
      total: 59830,
      distance: 12450,
    },
    {
      id: 'V002',
      name: 'Renault Master 2',
      fuelType: 'Diesel',
      purchase: 38000,
      fuel: 7800,
      maintenance: 3200,
      insurance: 1750,
      fines: 320,
      total: 51070,
      distance: 11200,
    },
    {
      id: 'V003',
      name: 'Ford Transit 3',
      fuelType: 'Diesel',
      purchase: 42000,
      fuel: 7200,
      maintenance: 3400,
      insurance: 1900,
      fines: 250,
      total: 54750,
      distance: 10800,
    },
    {
      id: 'V004',
      name: 'Citroën C3 4',
      fuelType: 'Essence',
      purchase: 22000,
      fuel: 5800,
      maintenance: 2100,
      insurance: 1200,
      fines: 180,
      total: 31280,
      distance: 9500,
    },
    {
      id: 'V005',
      name: 'Peugeot 308 5',
      fuelType: 'Essence',
      purchase: 25000,
      fuel: 5400,
      maintenance: 2200,
      insurance: 1250,
      fines: 210,
      total: 34060,
      distance: 8900,
    },
    {
      id: 'V006',
      name: 'Toyota Yaris 6',
      fuelType: 'Hybride',
      purchase: 32000,
      fuel: 2100,
      maintenance: 1800,
      insurance: 1100,
      fines: 120,
      total: 37120,
      distance: 7600,
    },
    {
      id: 'V007',
      name: 'Nissan Leaf 7',
      fuelType: 'Électrique',
      purchase: 48000,
      fuel: 800,
      maintenance: 1200,
      insurance: 1300,
      fines: 90,
      total: 51390,
      distance: 6200,
    },
    {
      id: 'V008',
      name: 'BMW i3 8',
      fuelType: 'Électrique',
      purchase: 52000,
      fuel: 950,
      maintenance: 1100,
      insurance: 1450,
      fines: 75,
      total: 55575,
      distance: 5800,
    },
  ];

  const handleExportCSV = () => {
    alert('Export CSV en cours de génération...');
  };

  const handleExportPDF = () => {
    alert('Export PDF en cours de génération...');
  };

  // Calculate total cost
  const totalCost = costBreakdown.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comptabilité & Coûts
          </h1>
          <p className="text-gray-600">
            Suivi financier de la flotte et analyse des dépenses
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilterType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="month">Mois</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Année</option>
              </select>
            </div>

            {/* Vehicle Group Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Groupe de véhicules
              </label>
              <select
                value={vehicleGroupFilter}
                onChange={(e) => setVehicleGroupFilter(e.target.value as VehicleGroupType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">Tous</option>
                <option value="diesel">Diesel</option>
                <option value="essence">Essence</option>
                <option value="hybride">Hybride</option>
                <option value="electric">Électrique</option>
              </select>
            </div>

            {/* Cost Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie de coût
              </label>
              <select
                value={costCategoryFilter}
                onChange={(e) => setCostCategoryFilter(e.target.value as CostCategoryType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">Tous</option>
                <option value="fuel">Carburant</option>
                <option value="maintenance">Maintenance</option>
                <option value="insurance">Assurance</option>
                <option value="fines">Amendes</option>
                <option value="tolls">Péages</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {kpiData.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-lg p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>{kpi.icon}</div>
                {kpi.trend !== undefined && (
                  <span
                    className={`text-xs font-semibold ${
                      kpi.trend < 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-xs font-medium mb-1">
                {kpi.label}
              </h3>
              <p className="text-xl font-bold text-gray-900">
                {kpi.value}
              </p>
              <p className="text-gray-500 text-xs">{kpi.unit}</p>
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart as Bars */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Répartition des coûts
            </h2>
            <div className="space-y-4">
              {costBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${item.color}`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.amount.toLocaleString('fr-FR')} €
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  {totalCost.toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Budget vs Réalité
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Carburant', budget: 150000, actual: 145680 },
                { label: 'Maintenance', budget: 95000, actual: 89420 },
                { label: 'Assurance', budget: 80000, actual: 78950 },
                { label: 'Amendes & Péages', budget: 20000, actual: 17270 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                    <div className="text-right text-xs">
                      <div className="text-gray-600">
                        Budget: {item.budget.toLocaleString('fr-FR')} €
                      </div>
                      <div className="font-semibold text-gray-900">
                        Réel: {item.actual.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 bg-blue-200 h-2 rounded-full" />
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(item.actual / item.budget) * 100}%`,
                        minWidth: '2px',
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(((item.budget - item.actual) / item.budget) * 100)}% sous budget
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Costs Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Évolution mensuelle des coûts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Mois
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Carburant (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Maintenance (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Assurance (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Amendes (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Péages (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Total (€)
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyCosts.map((month) => (
                  <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {month.fuel.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {month.maintenance.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {month.insurance.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {month.fines.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {month.tolls.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {month.total.toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle TCO Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Coût Total de Possession (TCO) par véhicule
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
                    Achat (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Carburant (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Maintenance (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Assurance (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Amendes (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    TCO (€)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    TCO/km (€)
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicleTCO.map((vehicle) => {
                  const tcoPerKm = (vehicle.total / vehicle.distance).toFixed(2);
                  return (
                    <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {vehicle.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{vehicle.fuelType}</td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {vehicle.purchase.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {vehicle.fuel.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {vehicle.maintenance.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {vehicle.insurance.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {vehicle.fines.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {vehicle.total.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {tcoPerKm}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Exporter les données comptables
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Téléchargez les rapports financiers en CSV ou PDF
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <FileJson className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;
