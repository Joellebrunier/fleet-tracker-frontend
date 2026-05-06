import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  Bell,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Wrench,
  Zap,
} from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
}

export default function DriverOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState('VH001');
  const [notifications, setNotifications] = useState({
    fuel: true,
    maintenance: true,
    zones: true,
  });

  const mockVehicles: Vehicle[] = [
    { id: 'VH001', plate: 'AB-123-CD', model: 'Mercedes Sprinter', year: 2023 },
    { id: 'VH002', plate: 'EF-456-GH', model: 'Renault Master', year: 2022 },
    { id: 'VH003', plate: 'IJ-789-KL', model: 'Volvo FM', year: 2023 },
  ];

  const features = [
    {
      icon: MapPin,
      title: 'Suivi GPS',
      description: 'Localisez votre véhicule en temps réel',
    },
    {
      icon: Zap,
      title: 'Alertes Carburant',
      description: 'Recevez des notifications sur la consommation',
    },
    {
      icon: Wrench,
      title: 'Maintenance',
      description: 'Planifiez l\'entretien de votre véhicule',
    },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 2) {
      setCurrentStep(3);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleStart = () => {
    console.log('Onboarding complete', {
      vehicle: selectedVehicle,
      notifications,
    });
  };

  const progressPercentage = ((currentStep + 1) / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto w-full px-4 sm:px-6 pt-4 pb-3">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Étape {currentStep + 1} sur 4
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => step <= currentStep && setCurrentStep(step)}
              className={`w-3 h-3 rounded-full transition-all ${
                step === currentStep
                  ? 'bg-emerald-600 w-8'
                  : step < currentStep
                    ? 'bg-emerald-400'
                    : 'bg-gray-300'
              }`}
              aria-label={`Étape ${step + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-8 flex flex-col">
        {/* Step 1: Welcome */}
        {currentStep === 0 && (
          <div className="space-y-6 flex flex-col h-full">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Bienvenue !
              </h2>
              <p className="text-gray-600 text-lg">
                Configurons votre expérience
              </p>
            </div>

            <div className="space-y-4 flex-1">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0">
                        <Icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-gray-600 bg-blue-50 rounded-xl p-4 border border-blue-100">
              Complétez cette configuration en quelques minutes pour commencer
            </p>
          </div>
        )}

        {/* Step 2: Vehicle Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 flex flex-col h-full">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Votre véhicule
              </h2>
              <p className="text-gray-600">
                Sélectionnez votre véhicule assigné
              </p>
            </div>

            <div className="space-y-3 flex-1">
              {mockVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`w-full text-left rounded-2xl p-5 transition-all border-2 ${
                    selectedVehicle === vehicle.id
                      ? 'border-emerald-600 bg-emerald-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vehicle.plate} • {vehicle.year}
                      </p>
                    </div>
                    {selectedVehicle === vehicle.id && (
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                Vous ne voyez pas votre véhicule ? Contactez votre gestionnaire
                de flotte.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Notifications */}
        {currentStep === 2 && (
          <div className="space-y-6 flex flex-col h-full">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Notifications
              </h2>
              <p className="text-gray-600">
                Choisissez ce que vous souhaitez recevoir
              </p>
            </div>

            <div className="space-y-3 flex-1">
              {/* Fuel Alerts */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 p-3 rounded-xl">
                      <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Alertes carburant
                      </p>
                      <p className="text-sm text-gray-600">
                        Niveaux bas et consommation
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer min-h-11 ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.fuel}
                      onChange={() => toggleNotification('fuel')}
                      className="w-6 h-6 rounded-lg border-gray-300 accent-emerald-600"
                    />
                  </label>
                </div>
              </div>

              {/* Maintenance Reminders */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <Wrench className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Rappels maintenance
                      </p>
                      <p className="text-sm text-gray-600">
                        Révisions et entretien prévu
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer min-h-11 ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.maintenance}
                      onChange={() => toggleNotification('maintenance')}
                      className="w-6 h-6 rounded-lg border-gray-300 accent-emerald-600"
                    />
                  </label>
                </div>
              </div>

              {/* Geofence Alerts */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Zones géographiques
                      </p>
                      <p className="text-sm text-gray-600">
                        Entrée/sortie de zones
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer min-h-11 ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.zones}
                      onChange={() => toggleNotification('zones')}
                      className="w-6 h-6 rounded-lg border-gray-300 accent-emerald-600"
                    />
                  </label>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Vous pouvez modifier ces paramètres à tout moment dans les
              préférences
            </p>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 3 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative bg-emerald-100 p-6 rounded-full">
                <CheckCircle className="w-16 h-16 text-emerald-600" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                C'est parti !
              </h2>
              <p className="text-lg text-gray-600">
                Votre compte est configuré et prêt à l'emploi
              </p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 space-y-3 w-full">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-sm">
                  Profil configuré
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-sm">
                  {mockVehicles.find((v) => v.id === selectedVehicle)
                    ?.model || 'Véhicule'}{' '}
                  assigné
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-sm">
                  Notifications configurées
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-4 border border-blue-100">
              Vous recevrez des mises à jour importantes directement dans
              l'application
            </p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-4 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors border border-gray-200 min-h-14 min-w-14 flex items-center justify-center"
              aria-label="Retour"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {currentStep < 3 && (
            <>
              {currentStep !== 0 && (
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors min-h-14"
                >
                  Ignorer
                </button>
              )}
              <button
                onClick={handleNext}
                className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors min-h-14 flex items-center justify-center gap-2 ${
                  currentStep === 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                Suivant
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {currentStep === 3 && (
            <button
              onClick={handleStart}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors min-h-14 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Commencer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
