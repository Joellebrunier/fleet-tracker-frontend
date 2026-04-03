import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HelpCircle, Book, Keyboard, Globe, Mail } from 'lucide-react';
const shortcuts = [
    { key: 'F', description: 'Basculer plein écran (carte)' },
    { key: 'T', description: 'Afficher couche trafic (carte)' },
    { key: 'S', description: 'Vue plan rue (carte)' },
    { key: 'A', description: 'Vue satellite (carte)' },
    { key: 'R', description: 'Vue terrain (carte)' },
    { key: '?', description: 'Afficher les raccourcis' },
    { key: 'Esc', description: 'Fermer les dialogues' },
];
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
        answer: 'TrackZone supporte l\'export en CSV, Excel (XLSX), PDF, KML et GPX pour les données GPS, et CSV/Excel pour les rapports et listes.',
    },
];
export default function HelpPage() {
    return (_jsxs("div", { className: "space-y-6 p-6 bg-[#0A0A0F] min-h-screen", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Aide et documentation" }), _jsx("p", { className: "mt-1 text-sm text-[#6B6B80]", children: "Trouvez des r\u00E9ponses \u00E0 vos questions et apprenez \u00E0 utiliser TrackZone" })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]", children: _jsxs(CardContent, { className: "pt-6 text-center", children: [_jsx(Book, { size: 32, className: "mx-auto mb-3 text-[#00E5CC]" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Guide de d\u00E9marrage" }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: "Apprenez les bases de TrackZone" })] }) }), _jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]", children: _jsxs(CardContent, { className: "pt-6 text-center", children: [_jsx(Globe, { size: 32, className: "mx-auto mb-3 text-[#00E5CC]" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Documentation API" }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: "Int\u00E9grez TrackZone \u00E0 vos syst\u00E8mes" })] }) }), _jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]", children: _jsxs(CardContent, { className: "pt-6 text-center", children: [_jsx(Mail, { size: 32, className: "mx-auto mb-3 text-[#FF4D6A]" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: "Contacter le support" }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: "Besoin d'aide ? \u00C9crivez-nous" })] }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-[#F0F0F5] font-syne", children: [_jsx(Keyboard, { size: 18 }), "Raccourcis clavier"] }), _jsx(CardDescription, { className: "text-[#6B6B80]", children: "Naviguez plus rapidement avec ces raccourcis" })] }), _jsx(CardContent, { children: _jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: shortcuts.map(s => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded hover:bg-[#1A1A25] transition-colors", children: [_jsx("kbd", { className: "px-2 py-1 bg-[#1A1A25] border border-[#1F1F2E] rounded text-xs font-mono font-bold text-[#6B6B80] min-w-[32px] text-center", children: s.key }), _jsx("span", { className: "text-sm text-[#6B6B80]", children: s.description })] }, s.key))) }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-[#F0F0F5] font-syne", children: [_jsx(HelpCircle, { size: 18 }), "Questions fr\u00E9quentes"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: faqItems.map((item, idx) => (_jsxs("div", { className: "border-b border-[#1F1F2E] pb-4 last:border-0 last:pb-0", children: [_jsx("p", { className: "font-medium text-[#F0F0F5] text-sm", children: item.question }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: item.answer })] }, idx))) }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-[#F0F0F5] font-syne", children: [_jsx(Globe, { size: 18 }), "Langues support\u00E9es"] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm text-[#6B6B80]", children: "TrackZone est actuellement disponible en fran\u00E7ais. Le support multilingue (anglais, espagnol, allemand) est pr\u00E9vu dans une future mise \u00E0 jour. Vous pouvez changer la langue dans les Param\u00E8tres > Pr\u00E9f\u00E9rences > Langue." }) })] })] }));
}
//# sourceMappingURL=HelpPage.js.map