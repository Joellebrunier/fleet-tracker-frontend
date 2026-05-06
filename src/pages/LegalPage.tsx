import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';

type ActiveTab = 'mentions' | 'conditions' | 'confidentialite' | 'rgpd';

interface TableOfContentsItem {
  id: string;
  label: string;
}

export default function LegalPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('mentions');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const tableOfContents: Record<ActiveTab, TableOfContentsItem[]> = {
    mentions: [
      { id: 'editeur', label: 'Édition du site' },
      { id: 'hebergement', label: 'Hébergement' },
      { id: 'directeur', label: 'Directeur de publication' },
      { id: 'credits', label: 'Crédits' },
    ],
    conditions: [
      { id: 'definitions', label: 'Définitions' },
      { id: 'acces', label: 'Accès au service' },
      { id: 'responsabilites', label: 'Responsabilités' },
      { id: 'limitation', label: 'Limitation de responsabilité' },
      { id: 'resilitation', label: 'Résiliation' },
    ],
    confidentialite: [
      { id: 'collecte', label: 'Collecte des données' },
      { id: 'cookies', label: 'Cookies' },
      { id: 'droits', label: 'Vos droits' },
      { id: 'partage', label: 'Partage des données' },
      { id: 'securite', label: 'Sécurité' },
    ],
    rgpd: [
      { id: 'droit-acces', label: 'Droit d\'accès' },
      { id: 'droit-rectification', label: 'Droit de rectification' },
      { id: 'droit-oubli', label: 'Droit à l\'oubli' },
      { id: 'droit-portabilite', label: 'Droit à la portabilité' },
      { id: 'recours', label: 'Droit de recours' },
    ],
  };

  const contentSections = {
    mentions: (
      <div className="space-y-6">
        <section id="editeur">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Édition du site</h3>
          <p className="text-gray-700 mb-4">
            Le site Fleet Track est édité par Fleet Track SAS, une société anonyme au capital social de 100 000 euros, immatriculée au registre du commerce et des sociétés de Lyon sous le numéro SIRET 82345789000012.
          </p>
          <p className="text-gray-700">
            Adresse du siège social: 123 rue des Alpes, 69000 Lyon, France
          </p>
        </section>

        <section id="hebergement">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Hébergement</h3>
          <p className="text-gray-700 mb-2">
            Le site est hébergé chez: Amazon Web Services EMEA, CS 61002, 75032 Paris cedex 2, France.
          </p>
          <p className="text-gray-700">
            Numéro SIRET: 90033891800026
          </p>
        </section>

        <section id="directeur">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Directeur de publication</h3>
          <p className="text-gray-700">
            Directeur: Jean Dupont, Président de Fleet Track SAS
          </p>
        </section>

        <section id="credits">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Crédits</h3>
          <p className="text-gray-700">
            Le site a été développé avec les technologies suivantes: React, TypeScript, Tailwind CSS, et Node.js. Les icônes proviennent de la bibliothèque Lucide Icons.
          </p>
        </section>
      </div>
    ),

    conditions: (
      <div className="space-y-6">
        <section id="definitions">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Définitions</h3>
          <p className="text-gray-700 mb-3">
            Les termes ci-après s'entendent comme suit:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Utilisateur:</strong> personne accédant à la plateforme Fleet Track
            </li>
            <li>
              <strong>Service:</strong> plateforme de suivi GPS en temps réel pour flottes
            </li>
            <li>
              <strong>Véhicule:</strong> tout véhicule suivi via la plateforme
            </li>
            <li>
              <strong>Données de localisation:</strong> informations GPS collectées
            </li>
          </ul>
        </section>

        <section id="acces">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Accès au service</h3>
          <p className="text-gray-700 mb-3">
            L'accès à Fleet Track est soumis à inscription et acceptation des présentes conditions. L'utilisateur doit:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Être une personne morale autorisée à contracter légalement</li>
            <li>Accepter de respecter les lois applicables</li>
            <li>Fournir des informations exactes lors de l'inscription</li>
            <li>Maintenir la confidentialité de ses identifiants de connexion</li>
          </ul>
        </section>

        <section id="responsabilites">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Responsabilités</h3>
          <p className="text-gray-700 mb-3">
            Fleet Track s'engage à mettre à disposition une plateforme fonctionnelle et sécurisée. Cependant, l'utilisateur reconnaît que:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Le service peut être temporairement indisponible pour maintenance</li>
            <li>Les données de localisation peuvent avoir un léger décalage</li>
            <li>L'utilisateur est responsable de l'utilisation du service</li>
            <li>Fleet Track ne peut être tenu responsable des actions menées sur la base des données fournies</li>
          </ul>
        </section>

        <section id="limitation">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Limitation de responsabilité</h3>
          <p className="text-gray-700">
            En aucun cas Fleet Track SAS ne pourra être tenue responsable des dommages directs ou indirects, notamment la perte de données, les interruptions de service, ou les manques à gagner résultant de l'utilisation ou de l'impossibilité d'utiliser le service.
          </p>
        </section>

        <section id="resilitation">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Résiliation</h3>
          <p className="text-gray-700">
            Fleet Track se réserve le droit de suspendre ou résilier l'accès de tout utilisateur qui violerait les présentes conditions d'utilisation. La résiliation peut intervenir sans préavis en cas de violation grave.
          </p>
        </section>
      </div>
    ),

    confidentialite: (
      <div className="space-y-6">
        <section id="collecte">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Collecte des données</h3>
          <p className="text-gray-700 mb-3">
            Fleet Track collecte les catégories de données suivantes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Données d'identification:</strong> nom, prénom, adresse email, numéro de téléphone
            </li>
            <li>
              <strong>Données de localisation:</strong> coordonnées GPS des véhicules, historique de trajets
            </li>
            <li>
              <strong>Données d'utilisation:</strong> logs d'accès, actions sur la plateforme
            </li>
            <li>
              <strong>Données de paiement:</strong> informations de facturation (pas de données bancaires)
            </li>
          </ul>
        </section>

        <section id="cookies">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Cookies</h3>
          <p className="text-gray-700 mb-3">
            Fleet Track utilise des cookies pour:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Conserver votre session d'authentification</li>
            <li>Mémoriser vos préférences d'affichage</li>
            <li>Analyser l'utilisation du service via Google Analytics</li>
            <li>Améliorer les performances</li>
          </ul>
          <p className="text-gray-700 mt-3">
            Vous pouvez désactiver les cookies via les paramètres de votre navigateur.
          </p>
        </section>

        <section id="droits">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Vos droits</h3>
          <p className="text-gray-700">
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, et de suppression de vos données. Pour exercer ces droits, contactez privacy@fleettrack.fr.
          </p>
        </section>

        <section id="partage">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Partage des données</h3>
          <p className="text-gray-700">
            Vos données ne sont pas vendues à des tiers. Elles peuvent être partagées avec:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Les prestataires techniques (hébergement, support)</li>
            <li>Les autorités publiques si requis par la loi</li>
            <li>Les autres utilisateurs autorisés de votre compte</li>
          </ul>
        </section>

        <section id="securite">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Sécurité</h3>
          <p className="text-gray-700">
            Fleet Track met en place des mesures de sécurité renforcées: chiffrement SSL/TLS, mots de passe hachés, authentification multifacteur optionnelle. Cependant, aucun système ne peut garantir une sécurité absolue.
          </p>
        </section>
      </div>
    ),

    rgpd: (
      <div className="space-y-6">
        <section id="droit-acces">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Droit d'accès</h3>
          <p className="text-gray-700">
            Vous avez le droit d'accéder à toutes les données personnelles que Fleet Track détient à votre sujet. Pour cela, adressez une demande à privacy@fleettrack.fr. Nous vous fournirons une copie dans un délai de 30 jours.
          </p>
        </section>

        <section id="droit-rectification">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Droit de rectification</h3>
          <p className="text-gray-700">
            Si vos données personnelles sont inexactes ou incomplètes, vous pouvez demander leur correction. Vous pouvez modifier directement vos informations dans les paramètres de votre compte ou contacter notre équipe support.
          </p>
        </section>

        <section id="droit-oubli">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Droit à l'oubli</h3>
          <p className="text-gray-700">
            Vous avez le droit de demander la suppression de vos données personnelles. Cette suppression sera effectuée sauf si Fleet Track a des obligations légales de conservation. Les données d'audit seront conservées conformément aux obligations légales.
          </p>
        </section>

        <section id="droit-portabilite">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Droit à la portabilité</h3>
          <p className="text-gray-700">
            Vous pouvez demander une copie de vos données dans un format structuré, couramment utilisé et lisible par machine. Cette copie vous sera fournie dans un délai de 30 jours.
          </p>
        </section>

        <section id="recours">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Droit de recours</h3>
          <p className="text-gray-700 mb-3">
            Si vous considérez que Fleet Track ne respecte pas vos droits en matière de données personnelles, vous pouvez:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Contacter notre délégué à la protection des données: dpo@fleettrack.fr</li>
            <li>Adresser une réclamation à la CNIL: www.cnil.fr</li>
          </ul>
        </section>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2540] to-[#243154] text-white py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </button>
          <h1 className="text-3xl md:text-4xl font-bold">Informations légales</h1>
          <p className="text-gray-300 mt-2">
            Consultez nos mentions légales et conditions d'utilisation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="font-bold text-gray-900 mb-4">Sommaire</h3>
              <nav className="space-y-2">
                {tableOfContents[activeTab].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors py-1"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap border-b border-gray-200">
              <button
                onClick={() => setActiveTab('mentions')}
                className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'mentions'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Mentions légales
              </button>
              <button
                onClick={() => setActiveTab('conditions')}
                className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'conditions'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Conditions d'utilisation
              </button>
              <button
                onClick={() => setActiveTab('confidentialite')}
                className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'confidentialite'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Confidentialité
              </button>
              <button
                onClick={() => setActiveTab('rgpd')}
                className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'rgpd'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                RGPD
              </button>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              {contentSections[activeTab]}
            </div>

            {/* Contact Footer */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Besoin d'aide?</h3>
              <p className="text-gray-700 text-sm">
                Pour toute question concernant ces documents ou vos données personnelles, contactez-nous à{' '}
                <a
                  href="mailto:legal@fleettrack.fr"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  legal@fleettrack.fr
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 md:px-8 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm mb-2">
            &copy; 2026 Fleet Track SAS. Tous droits réservés.
          </p>
          <p className="text-xs">
            Fleet Track SAS - SIRET: 82345789000012 - 123 rue des Alpes, 69000 Lyon
          </p>
        </div>
      </footer>
    </div>
  );
}
