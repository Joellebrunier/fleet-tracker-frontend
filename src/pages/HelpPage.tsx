import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Book, MessageCircle, Keyboard, Globe, Mail } from 'lucide-react'

const shortcuts = [
  { key: 'F', description: 'Basculer plein écran (carte)' },
  { key: 'T', description: 'Afficher couche trafic (carte)' },
  { key: 'S', description: 'Vue plan rue (carte)' },
  { key: 'A', description: 'Vue satellite (carte)' },
  { key: 'R', description: 'Vue terrain (carte)' },
  { key: '?', description: 'Afficher les raccourcis' },
  { key: 'Esc', description: 'Fermer les dialogues' },
]

const faqItems = [
  {
    question: 'Comment ajouter un véhicule ?',
    answer: 'Accédez à la page Véhicules et cliquez sur "Ajouter un véhicule". Renseignez les informations requises et associez un traceur GPS.',
  },
  {
    question: 'Comment configurer une géoclôture ?',
    answer: 'Rendez-vous sur la page Géoclôtures, cliquez sur "Créer une géoclôture" et dessinez la zone sur la carte. Vous pouvez choisir un cercle, un polygone ou un rectangle.',
  },
  {
    question: 'Comment exporter les données GPS ?',
    answer: 'Sur la page de détail d\'un véhicule, utilisez le bouton "Exporter" pour télécharger l\'historique GPS en CSV, KML, GPX ou Excel.',
  },
  {
    question: 'Comment créer une règle d\'alerte ?',
    answer: 'Sur la page Alertes, onglet "Règles", cliquez sur "Nouvelle règle". Suivez l\'assistant en 3 étapes pour définir le type, la configuration et les actions.',
  },
  {
    question: 'Comment ajouter un fournisseur GPS ?',
    answer: 'Dans les Paramètres, section "Fournisseurs GPS", activez le fournisseur souhaité et saisissez vos identifiants API.',
  },
  {
    question: 'Quels formats d\'export sont supportés ?',
    answer: 'Fleet Tracker supporte l\'export en CSV, Excel (XLSX), PDF, KML et GPX pour les données GPS, et CSV/Excel pour les rapports et listes.',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-sans">Aide et documentation</h1>
        <p className="mt-1 text-sm text-gray-500">Trouvez des réponses à vos questions et apprenez à utiliser Fleet Tracker</p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300">
          <CardContent className="pt-6 text-center">
            <Book size={32} className="mx-auto mb-3 text-blue-600" />
            <p className="font-medium text-gray-900">Guide de démarrage</p>
            <p className="text-sm text-gray-500 mt-1">Apprenez les bases de Fleet Tracker</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300">
          <CardContent className="pt-6 text-center">
            <Globe size={32} className="mx-auto mb-3 text-blue-600" />
            <p className="font-medium text-gray-900">Documentation API</p>
            <p className="text-sm text-gray-500 mt-1">Intégrez Fleet Tracker à vos systèmes</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300">
          <CardContent className="pt-6 text-center">
            <Mail size={32} className="mx-auto mb-3 text-red-500" />
            <p className="font-medium text-gray-900">Contacter le support</p>
            <p className="text-sm text-gray-500 mt-1">Besoin d'aide ? Écrivez-nous</p>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 font-sans">
            <Keyboard size={18} />
            Raccourcis clavier
          </CardTitle>
          <CardDescription className="text-gray-500">Naviguez plus rapidement avec ces raccourcis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {shortcuts.map(s => (
              <div key={s.key} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition-colors">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono font-bold text-gray-500 min-w-[32px] text-center">
                  {s.key}
                </kbd>
                <span className="text-sm text-gray-500">{s.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 font-sans">
            <HelpCircle size={18} />
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <p className="font-medium text-gray-900 text-sm">{item.question}</p>
                <p className="text-sm text-gray-500 mt-1">{item.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support multilingue */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 font-sans">
            <Globe size={18} />
            Langues supportées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Fleet Tracker est actuellement disponible en français. Le support multilingue (anglais, espagnol, allemand) est prévu dans une future mise à jour.
            Vous pouvez changer la langue dans les Paramètres &gt; Préférences &gt; Langue.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
