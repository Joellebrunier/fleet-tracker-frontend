import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Zap,
  BarChart3,
  Fuel,
  Wrench,
  Users,
  ArrowRight,
  Check,
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Pricing {
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export default function LandingPage() {
  const navigate = useNavigate();

  const features: Feature[] = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Suivi temps réel',
      description: 'Localisez vos véhicules en direct sur une carte interactive avec mise à jour toutes les secondes.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Alertes intelligentes',
      description: 'Recevez des notifications pour les écarts de route, excès de vitesse, et comportements anormaux.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Rapports détaillés',
      description: 'Analysez les trajets, consommation de carburant et productivité avec des tableaux de bord complets.',
    },
    {
      icon: <Fuel className="w-6 h-6" />,
      title: 'Gestion carburant',
      description: 'Optimisez vos dépenses énergétiques et détectez les anomalies de consommation automatiquement.',
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: 'Maintenance préventive',
      description: 'Planifiez l\'entretien avant les pannes avec des alertes de maintenance programmées.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Application conducteur',
      description: 'Donnez à vos conducteurs une app mobile pour communiquer, respecter les consignes et améliorer la sécurité.',
    },
  ];

  const pricingTiers: Pricing[] = [
    {
      name: 'Starter',
      price: '29',
      unit: '€/véhicule/mois',
      features: [
        'Suivi temps réel',
        'Alertes basiques',
        'Rapports mensuels',
        'Support email',
        'Jusqu\'à 50 véhicules',
      ],
      cta: 'Essai gratuit',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '49',
      unit: '€/véhicule/mois',
      features: [
        'Toutes les fonctionnalités Starter',
        'Alertes avancées',
        'Rapports détaillés',
        'Gestion carburant',
        'Maintenance préventive',
        'Support prioritaire',
        'Jusqu\'à 500 véhicules',
      ],
      cta: 'Essai gratuit',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      unit: '',
      features: [
        'Toutes les fonctionnalités Pro',
        'Intégrations personnalisées',
        'Déploiement dédié',
        'SLA garanti 99.9%',
        'Support 24/7',
        'Formation complète',
        'Véhicules illimités',
      ],
      cta: 'Demander un devis',
      highlighted: false,
    },
  ];

  const stats = [
    { value: '+500', label: 'véhicules suivis' },
    { value: '99.9%', label: 'disponibilité' },
    { value: '+50', label: 'entreprises' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">FLEET TRACK</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="hover:text-gray-300 transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="hover:text-gray-300 transition-colors">
              Tarifs
            </a>
            <button
              onClick={() => navigate('/login')}
              className="text-white hover:text-gray-300 transition-colors"
            >
              Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Géolocalisation GPS en temps réel pour votre flotte
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Suivez vos véhicules, optimisez vos trajets et réduisez vos coûts opérationnels avec Fleet Track.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-8 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                Essai gratuit
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white py-3 px-8 rounded-lg font-medium transition-colors"
              >
                Connexion
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#4361EE] mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités puissantes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce dont vous avez besoin pour gérer efficacement votre flotte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`rounded-lg overflow-hidden transition-all ${
                  tier.highlighted
                    ? 'ring-2 ring-[#4361EE] shadow-xl scale-105'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-6 ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-[#1a2540] to-[#243154] text-white'
                      : 'bg-white'
                  }`}
                >
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      !tier.highlighted && 'text-gray-900'
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold ${
                        !tier.highlighted && 'text-gray-900'
                      }`}
                    >
                      {tier.price}
                    </span>
                    {tier.unit && (
                      <span
                        className={`text-sm ${
                          tier.highlighted ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {tier.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white">
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full py-2 px-4 rounded-lg font-medium mb-6 transition-colors ${
                      tier.highlighted
                        ? 'bg-[#4361EE] hover:bg-blue-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {tier.cta}
                  </button>

                  <ul className="space-y-3">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-[#1a2540] to-[#243154]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à optimiser votre flotte?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Commencez votre essai gratuit de 14 jours sans carte de crédit
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-8 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            Créer un compte
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">FLEET TRACK</span>
              </div>
              <p className="text-sm">
                Géolocalisation GPS pour les flottes professionnelles
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Tarifs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/legal" className="hover:text-white transition-colors">
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a href="/legal" className="hover:text-white transition-colors">
                    Confidentialité
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@fleettrack.fr"
                    className="hover:text-white transition-colors"
                  >
                    Contact support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
            <p>&copy; 2026 Fleet Track SAS. Tous droits réservés.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/legal" className="hover:text-white transition-colors">
                Mentions légales
              </a>
              <a href="/legal" className="hover:text-white transition-colors">
                Conditions d'utilisation
              </a>
              <a href="/legal" className="hover:text-white transition-colors">
                Politique de confidentialité
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
