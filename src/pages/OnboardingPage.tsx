'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

interface OrganisationData {
  name: string;
  address: string;
  sector: 'transport' | 'btp' | 'livraison' | 'autre';
  fleetSize: string;
}

interface VehicleData {
  immatriculation: string;
  marque: string;
  modele: string;
  carburant: 'essence' | 'diesel' | 'electrique' | 'hybride';
}

interface GPSDeviceData {
  imei: string;
  type: 'flespi' | 'echoes' | 'keeptrace';
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0);
  const [organisation, setOrganisation] = useState<OrganisationData>({
    name: '',
    address: '',
    sector: 'transport',
    fleetSize: '',
  });
  const [vehicle, setVehicle] = useState<VehicleData>({
    immatriculation: '',
    marque: '',
    modele: '',
    carburant: 'diesel',
  });
  const [gpsDevice, setGpsDevice] = useState<GPSDeviceData>({
    imei: '',
    type: 'flespi',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const validateStep = (): boolean => {
    const newErrors: string[] = [];

    if (currentStep === 1) {
      if (!organisation.name.trim()) newErrors.push('Le nom de l\'entreprise est requis');
      if (!organisation.address.trim()) newErrors.push('L\'adresse est requise');
      if (!organisation.fleetSize) newErrors.push('La taille de la flotte est requise');
    }

    if (currentStep === 2) {
      if (!vehicle.immatriculation.trim()) newErrors.push('L\'immatriculation est requise');
      if (!vehicle.marque.trim()) newErrors.push('La marque est requise');
      if (!vehicle.modele.trim()) newErrors.push('Le modèle est requis');
    }

    if (currentStep === 3) {
      if (!gpsDevice.imei.trim()) newErrors.push('L\'IMEI est requis');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
      setErrors([]);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
      setErrors([]);
    }
  };

  const handleSkip = () => {
    if (currentStep < 4 && (currentStep === 2 || currentStep === 3)) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
      setErrors([]);
    }
  };

  const handleDashboard = () => {
    console.log('Navigating to dashboard...');
  };

  const progressPercentage = ((currentStep + 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
          {/* Step 0: Bienvenue */}
          {currentStep === 0 && (
            <div className="space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Bienvenue à Fleet Tracker
                </h1>
                <p className="text-xl text-gray-600">
                  Gestion simplifiée de votre flotte GPS
                </p>
              </div>

              <div className="space-y-4 text-left bg-blue-50 p-6 rounded-lg">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Suivi en temps réel</h3>
                    <p className="text-gray-600">Localisez tous vos véhicules instantanément</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analyse de carburant</h3>
                    <p className="text-gray-600">Détectez les anomalies et optimisez les coûts</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Alertes intelligentes</h3>
                    <p className="text-gray-600">Recevez les notifications essentielles</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                Configuration en 5 minutes. Pas de carte bancaire requise.
              </p>
            </div>
          )}

          {/* Step 1: Organisation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Informations de l'organisation
                </h2>
                <p className="text-gray-600">
                  Décrivez votre entreprise et votre flotte
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={organisation.name}
                    onChange={(e) =>
                      setOrganisation({ ...organisation, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Transport Dupont SARL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={organisation.address}
                    onChange={(e) =>
                      setOrganisation({ ...organisation, address: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: 123 Rue de la Paix, 75000 Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité
                  </label>
                  <select
                    value={organisation.sector}
                    onChange={(e) =>
                      setOrganisation({
                        ...organisation,
                        sector: e.target.value as OrganisationData['sector'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="transport">Transport routier</option>
                    <option value="btp">BTP / Construction</option>
                    <option value="livraison">Livraison / Logistique</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille de la flotte
                  </label>
                  <select
                    value={organisation.fleetSize}
                    onChange={(e) =>
                      setOrganisation({ ...organisation, fleetSize: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="1-5">1 à 5 véhicules</option>
                    <option value="6-20">6 à 20 véhicules</option>
                    <option value="21-100">21 à 100 véhicules</option>
                    <option value="100+">Plus de 100 véhicules</option>
                  </select>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                  {errors.map((error, idx) => (
                    <div key={idx} className="flex gap-2 text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Véhicules */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ajouter votre premier véhicule
                </h2>
                <p className="text-gray-600">
                  Remplissez les informations de base
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Immatriculation
                  </label>
                  <input
                    type="text"
                    value={vehicle.immatriculation}
                    onChange={(e) =>
                      setVehicle({ ...vehicle, immatriculation: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: AB-123-CD"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marque
                    </label>
                    <input
                      type="text"
                      value={vehicle.marque}
                      onChange={(e) =>
                        setVehicle({ ...vehicle, marque: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ex: Renault"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modèle
                    </label>
                    <input
                      type="text"
                      value={vehicle.modele}
                      onChange={(e) =>
                        setVehicle({ ...vehicle, modele: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ex: Master"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de carburant
                  </label>
                  <select
                    value={vehicle.carburant}
                    onChange={(e) =>
                      setVehicle({
                        ...vehicle,
                        carburant: e.target.value as VehicleData['carburant'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="essence">Essence</option>
                    <option value="electrique">Électrique</option>
                    <option value="hybride">Hybride</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-6">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 font-medium hover:border-blue-500 hover:bg-blue-50 transition">
                  <Upload className="h-5 w-5" />
                  Importer un CSV
                </button>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                  {errors.map((error, idx) => (
                    <div key={idx} className="flex gap-2 text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Traceurs GPS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ajouter un traceur GPS
                </h2>
                <p className="text-gray-600">
                  Configurez votre premier dispositif de suivi
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMEI du traceur
                  </label>
                  <input
                    type="text"
                    value={gpsDevice.imei}
                    onChange={(e) =>
                      setGpsDevice({ ...gpsDevice, imei: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: 357521096827449"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de traceur
                  </label>
                  <select
                    value={gpsDevice.type}
                    onChange={(e) =>
                      setGpsDevice({
                        ...gpsDevice,
                        type: e.target.value as GPSDeviceData['type'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="flespi">Flespi</option>
                    <option value="echoes">Echoes</option>
                    <option value="keeptrace">KeepTrace</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Instructions d'appairage :
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                    <li>Alimentez le traceur GPS</li>
                    <li>Attendez 30 secondes pour la mise en ligne</li>
                    <li>Le système détectera automatiquement votre traceur</li>
                    <li>Validez l'appairage sur cet écran</li>
                  </ol>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                  {errors.map((error, idx) => (
                    <div key={idx} className="flex gap-2 text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Terminé */}
          {currentStep === 4 && (
            <div className="space-y-8 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Configuration terminée !
                </h2>
                <p className="text-gray-600 text-lg">
                  Votre Fleet Tracker est prêt à fonctionner
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-2">
                <p className="font-semibold text-gray-900">
                  ✓ Organisation configurée
                </p>
                <p className="font-semibold text-gray-900">
                  ✓ Véhicule ajouté
                </p>
                <p className="font-semibold text-gray-900">
                  ✓ Traceur GPS appairé
                </p>
              </div>

              <p className="text-gray-600 text-sm">
                Les données de suivi apparaîtront dans 2-3 minutes
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="h-5 w-5" />
                Précédent
              </button>
            )}

            {currentStep < 4 && (currentStep === 2 || currentStep === 3) && (
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Passer
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Suivant
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleDashboard}
                className="flex-1 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
              >
                Accéder au tableau de bord
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
