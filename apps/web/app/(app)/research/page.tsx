'use client';

import { useState } from 'react';
import {
  Search,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  TrendingUp,
  Globe,
  Shield,
  Zap,
  BarChart3,
  Target,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TradeIdea {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  underlying: string;
  returnPct: number;
  category: 'thematic' | 'sector' | 'macro' | 'esg';
  imageColor: string;
  analysis: {
    thesis: string;
    keyMetrics: { label: string; value: string }[];
    catalysts: string[];
    risks: string[];
    sources: string[];
    structureDetails: string;
  };
}

// ─── Real Financial Data (March 2026) ─────────────────────────────────────────

const TRADE_IDEAS: TradeIdea[] = [
  {
    id: '1',
    title: 'Défense Européenne : Le Supercycle',
    subtitle: 'Phoenix Autocall — Worst-Of',
    date: '2026-03-03',
    underlying: 'Rheinmetall / Thales',
    returnPct: 19,
    category: 'sector',
    imageColor: '#0A2799',
    analysis: {
      thesis: 'Les budgets de défense en Europe augmentent structurellement. Les pays de l\'OTAN visent 3-5% du PIB contre 2% précédemment. La Pologne dépasse 4.5% en 2025. Le STOXX Europe Aerospace & Defense Index a progressé de +65% en 2025. Rheinmetall a bondi de +200% depuis janvier 2025, portée par les commandes d\'armement terrestre. Thales est jugé sous-évalué par Morningstar avec un positionnement clé en cyberdéfense et avionique.',
      keyMetrics: [
        { label: 'Croissance Rheinmetall 2025', value: '+200%' },
        { label: 'STOXX A&D Index 2025', value: '+65%' },
        { label: 'Budgets défense UE /an', value: '+6.8%' },
        { label: 'Carnets de commandes', value: '+15%' },
      ],
      catalysts: [
        'Plans de réarmement européens (Allemagne : €100Mrd fonds spécial)',
        'Prolongation du conflit Ukraine — dépenses munitions record',
        'BEI triple les financements défense à €3Mrd',
        'M&A en accélération : +35% en H1 2025',
      ],
      risks: [
        'Cessez-le-feu Ukraine → baisse temporaire du secteur',
        'Valorisations élevées (Rheinmetall P/E forward 39x)',
        'Cycles de contrats longs (10-15 ans)',
      ],
      sources: [
        'Morningstar — European Defense Stocks Analysis 2026',
        'Fitch Ratings — European Defense Companies',
        'STOXX Europe Total Market Aerospace & Defense Index',
      ],
      structureDetails: 'Autocall Phoenix Worst-Of sur panier Rheinmetall/Thales. Rappel anticipé si les deux titres sont ≥ 100% du niveau initial. Coupon mémoire 19% p.a. conditionnel si aucun titre < 60%. Barrière capitale 50% à maturité. Durée max 5 ans.',
    },
  },
  {
    id: '2',
    title: 'IA & Semiconducteurs : La Vague Continue',
    subtitle: 'Athena Worst-Of',
    date: '2026-02-19',
    underlying: 'NVIDIA / ASML',
    returnPct: 16,
    category: 'thematic',
    imageColor: '#3B1FA8',
    analysis: {
      thesis: 'L\'industrie des semiconducteurs a généré $772Mrd de revenus en 2025 (+22.5%) et le consensus prévoit $975Mrd en 2026 (+26.3%). NVIDIA reste le leader incontesté de l\'IA avec Blackwell en ramp-up complet et Rubin prévu pour H2 2026. ASML a relevé ses prévisions : CA 2026 entre €34-39Mrd. Les dépenses en serveurs IA pourraient bondir de 45% en 2026 à $312Mrd selon Bloomberg Intelligence.',
      keyMetrics: [
        { label: 'NVIDIA performance 2025', value: '+39%' },
        { label: 'ASML performance 2025', value: '+54%' },
        { label: 'Revenus secteur 2026e', value: '$975Mrd' },
        { label: 'Dépenses serveurs IA 2026', value: '$312Mrd' },
      ],
      catalysts: [
        'NVIDIA Blackwell ramp-up complet — Rubin en H2 2026',
        'ASML : carnet de commandes EUV record (€7.4Mrd Q4)',
        'Investissements hyperscalers IA en accélération',
        'Reshoring semi-conducteurs (CHIPS Act US + EU)',
      ],
      risks: [
        'Volatilité élevée (NVIDIA beta 2.31)',
        'Restrictions export Chine — impact sur revenus',
        'Valorisations tendues (ASML P/E forward 34x)',
      ],
      sources: [
        'Wolfe Research — NVIDIA Top AI Pick 2026',
        'Morgan Stanley — ASML Price Target €1,400',
        'Bloomberg Intelligence — AI Server Spending',
        'WSTS — Semiconductor Industry Forecast',
      ],
      structureDetails: 'Autocall Athena Worst-Of sur NVIDIA/ASML. Rappel anticipé dès l\'année 1 si les deux titres ≥ 100%. Gain à maturité 16% par année écoulée. Barrière capitale 50%. Protection partielle grâce à la diversification sectorielle (design + équipement).',
    },
  },
  {
    id: '3',
    title: 'Or : Valeur Refuge & Capital Protégé',
    subtitle: 'Note à Capital Protégé 90%',
    date: '2026-02-05',
    underlying: 'iEdge Gold Shares EUR Index',
    returnPct: 12,
    category: 'macro',
    imageColor: '#D4A017',
    analysis: {
      thesis: 'L\'or a atteint $5,081/oz en mars 2026. J.P. Morgan cible $6,300 fin 2026, Goldman Sachs $5,400 et Wells Fargo $6,100-6,300. Les achats des banques centrales restent record : 95% d\'entre elles prévoient d\'augmenter leurs réserves d\'or. Les ETF or ont enregistré des flux entrants massifs. L\'incertitude géopolitique et la politique tarifaire américaine soutiennent la demande.',
      keyMetrics: [
        { label: 'Prix actuel (mars 2026)', value: '$5,081/oz' },
        { label: 'Cible JPM fin 2026', value: '$6,300/oz' },
        { label: 'Cible Goldman Sachs', value: '$5,400/oz' },
        { label: 'Achats banques centrales', value: '>1,000t/an' },
      ],
      catalysts: [
        'Banques centrales : 3ème année > 1,000 tonnes d\'achats',
        'Tensions géopolitiques persistantes',
        'Diversification hors dollar US',
        'Offre minière contrainte (10-20 ans pour nouvelles mines)',
      ],
      risks: [
        'Hausse des taux réels → pression baissière',
        'Renforcement du dollar',
        'Correction possible de 5-20% (scénario Citi)',
      ],
      sources: [
        'J.P. Morgan — Gold Price Target $6,300',
        'World Gold Council — Gold Outlook 2026',
        'Morgan Stanley — Gold Rally Forecast',
        'Goldman Sachs — Commodities Research',
      ],
      structureDetails: 'Note à capital protégé 90% indexée sur iEdge Gold Shares EUR PR Index. Participation à la hausse plafonnée à 121% du nominal. Durée 3 ans. Protection du capital en cas de baisse limitée à -10%.',
    },
  },
  {
    id: '4',
    title: 'Taux EUR : Profiter du Plateau BCE',
    subtitle: 'Coupon Conditionnel — EUR CMS 10Y',
    date: '2026-01-20',
    underlying: 'EUR CMS 10 ans',
    returnPct: 6,
    category: 'macro',
    imageColor: '#008B6E',
    analysis: {
      thesis: 'La BCE maintient ses taux à 2.15% (MRO) et 2.00% (facilité de dépôt). Le consensus Reuters prévoit des taux stables jusqu\'à mi-2026 au minimum. La courbe des taux EUR s\'est pentifiée significativement en 2025 avec une hausse de 26bp du taux 10 ans nominal OIS. L\'inflation zone euro est tombée à 1.7% en janvier 2026, sous la cible de 2%. Environnement idéal pour les produits de taux conditionnels.',
      keyMetrics: [
        { label: 'Taux BCE (dépôt)', value: '2.00%' },
        { label: 'Taux BCE (MRO)', value: '2.15%' },
        { label: 'Inflation zone euro', value: '1.7%' },
        { label: 'Core inflation', value: '2.2%' },
      ],
      catalysts: [
        'BCE : taux stables attendus tout au long de 2026',
        'Pentification de la courbe — taux longs en hausse',
        'Inflation sous la cible de 2%',
        'Primes de terme en hausse structurelle',
      ],
      risks: [
        'Surprise inflationniste → hausse de taux inattendue',
        'Risque budgétaire souverain (France, Italie)',
        'Choc géopolitique affectant les marchés obligataires',
      ],
      sources: [
        'BCE — Comptes rendus des réunions (janv-fév 2026)',
        'Reuters — ECB Rate Poll',
        'ECB Blog — Euro Area Yield Curve Repricing',
        'Survey of Professional Forecasters Q4 2025',
      ],
      structureDetails: 'Coupon conditionnel 6% p.a. si le taux EUR CMS 10 ans reste ≤ 3.20%. Capital intégralement protégé à maturité. Possibilité de remboursement anticipé si taux ≤ 2.40%. Durée 12 ans.',
    },
  },
  {
    id: '5',
    title: 'Transition Verte : Le Rebond Sélectif',
    subtitle: 'Phoenix Mémoire — Clean Energy',
    date: '2025-12-10',
    underlying: 'Engie / RWE',
    returnPct: 14,
    category: 'esg',
    imageColor: '#00B894',
    analysis: {
      thesis: 'Les actions d\'énergie renouvelable ont rebondi de +23 points de pourcentage en 2025. Après 9 trimestres de sorties nettes, les fonds européens clean energy ont reçu près de €900M d\'entrées au Q4 2025. La narration a évolué : sécurité énergétique, compétitivité industrielle et électrification IA dominent. RWE est identifiée comme bénéficiaire clé du mix transition + indépendance européenne.',
      keyMetrics: [
        { label: 'Rebond clean energy 2025', value: '+23pp' },
        { label: 'Flux fonds Q4 2025', value: '€900M' },
        { label: 'Croissance capacité renouvelable', value: '+15%/an' },
        { label: 'Mécanisme CBAM UE', value: 'Actif' },
      ],
      catalysts: [
        'Demande électricité IA → besoin infrastructures vertes',
        'CBAM européen renforce la compétitivité verte',
        'RWE : sortie du charbon + build-out renouvelable massif',
        'Directive Omnibus UE adoptée (fév. 2026)',
      ],
      risks: [
        'Taux élevés → coût de financement des projets',
        'Retards de permitting et interconnexion réseau',
        'Volatilité des rendements projets',
      ],
      sources: [
        'Morningstar — Are Renewable Energy Stocks a Buy in 2026',
        'LSEG — Sustainable Investment Context 2026',
        'Franklin Templeton — ESG 2026 Outlook',
        'World Gold Council — Energy Transition',
      ],
      structureDetails: 'Phoenix à mémoire sur panier Engie/RWE. Coupon 14% p.a. avec effet mémoire si les deux titres ≥ 65% du niveau initial. Barrière capitale 50%. Rappel anticipé possible dès l\'année 2.',
    },
  },
  {
    id: '6',
    title: 'Autocalls Europe : Track Record Exceptionnel',
    subtitle: 'Phoenix Autocall — Euro Stoxx 50',
    date: '2025-11-15',
    underlying: 'Euro Stoxx 50',
    returnPct: 8,
    category: 'thematic',
    imageColor: '#5535C4',
    analysis: {
      thesis: 'En 2025, 338 autocalls UK capital-at-risk liés au FTSE ont maturé : 100% ont rapporté capital + profit. Le rendement annualisé moyen était de 7.85%. Sur la décennie 2016-2025, plus de 2,000 maturités avec 99.7% de rendements positifs et zéro perte en capital. Le sentiment sur les produits structurés est au plus haut : 85% des professionnels sont optimistes ou très optimistes.',
      keyMetrics: [
        { label: 'Autocalls UK maturés 2025', value: '338 (100% +)' },
        { label: 'Rendement moyen annualisé', value: '7.85%' },
        { label: 'Track record 10 ans', value: '99.7% positif' },
        { label: 'Durée de vie moyenne', value: '2.3 ans' },
      ],
      catalysts: [
        'Euro Stoxx 50 proche des plus hauts historiques',
        'Momentum bénéficiaire : +13% attendu en 2026',
        'Conditions de marché favorables au rappel anticipé',
        'BNP Paribas innove : structure "Catapult" à upside x1.5',
      ],
      risks: [
        'Correction de marché → extension de la durée de vie',
        'Tarifs douaniers US → volatilité accrue (VIX +40% en avril 2025)',
        'Risque de contrepartie bancaire',
      ],
      sources: [
        'SRP — Global Market Sentiment Survey 2025/2026',
        'IDAD — Autocall Track Record Analysis',
        'Risk.net — BNP Paribas Structured Products House of the Year',
        'Morgan Stanley — 2026 Market Outlook',
      ],
      structureDetails: 'Phoenix Autocall classique sur Euro Stoxx 50. Coupon 8% p.a. si indice ≥ 70% du niveau initial. Rappel anticipé dès l\'année 1 si indice ≥ 100%. Barrière capitale 60% de type européenne. Durée max 10 ans.',
    },
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  thematic: { label: 'Thématique', color: '#3B1FA8' },
  sector: { label: 'Sectoriel', color: '#0A2799' },
  macro: { label: 'Macro', color: '#D4A017' },
  esg: { label: 'ESG', color: '#00B894' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIdea, setSelectedIdea] = useState<TradeIdea | null>(TRADE_IDEAS[0]!);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const currentFeatured = TRADE_IDEAS[featuredIndex]!;

  const filteredIdeas = TRADE_IDEAS.filter((idea) => {
    const matchesSearch =
      !searchQuery ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.underlying.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || idea.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold leading-tight bg-gradient-to-r from-violet via-violet-dark to-indigo-600 bg-clip-text text-transparent">
          Research & Trade Ideas
        </h1>
        <p className="text-sm text-ink-3 font-body mt-1.5 max-w-xl">
          Analyses de marché et idées de structuration basées sur des données financières en temps réel.
        </p>
        <div className="gradient-bar h-[3px] rounded-full mt-5 opacity-70" />
      </div>

      {/* ── Featured Carousel ───────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-white via-white to-violet-ghost/30 rounded-xl border border-border/80 p-6 mb-6 shadow-sm hover:shadow-card transition-shadow duration-300">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setFeaturedIndex((i) => Math.max(0, i - 1))}
            disabled={featuredIndex === 0}
            className="shrink-0 w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet hover:shadow-md hover:scale-110 transition-all duration-200 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 text-center">
            <p className="text-[11px] text-violet font-semibold font-body uppercase tracking-wider mb-2">
              {formatDate(currentFeatured.date)}
            </p>
            <h2 className="font-display text-xl font-bold text-ink leading-snug mb-1">
              {currentFeatured.title}
            </h2>
            <p className="text-sm text-ink-3 font-body">{currentFeatured.subtitle}</p>
            <p className="font-display text-2xl font-bold bg-gradient-to-r from-violet to-teal bg-clip-text text-transparent mt-2 drop-shadow-sm">
              {currentFeatured.returnPct}%
            </p>
          </div>

          <button
            onClick={() => setFeaturedIndex((i) => Math.min(TRADE_IDEAS.length - 1, i + 1))}
            disabled={featuredIndex === TRADE_IDEAS.length - 1}
            className="shrink-0 w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet hover:shadow-md hover:scale-110 transition-all duration-200 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>

          <div className="shrink-0 flex flex-col gap-2 border-l border-border/60 pl-6">
            <button className="flex items-center gap-2 text-[12px] text-ink-3 hover:text-violet hover:translate-x-0.5 transition-all duration-200 font-body">
              <Download size={14} />
              Télécharger
            </button>
            <button className="flex items-center gap-2 text-[12px] text-ink-3 hover:text-violet hover:translate-x-0.5 transition-all duration-200 font-body">
              <Share2 size={14} />
              Partager
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une idée de trade..."
            className={cn(
              'w-full h-9 rounded-lg border border-border/80 bg-white/80 backdrop-blur-sm pl-9 pr-3 text-[13px] font-body text-ink shadow-sm',
              'placeholder:text-ink-3/60 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet focus:shadow-md',
            )}
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-200 hover:scale-105 active:scale-95',
              !selectedCategory
                ? 'bg-gradient-to-r from-violet to-violet-dark text-white shadow-sm'
                : 'bg-white border border-border/80 text-ink-3 hover:text-ink hover:shadow-sm',
            )}
          >
            Tous
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? '' : key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-200 border hover:scale-105 active:scale-95',
                selectedCategory === key
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white border-border/80 text-ink-3 hover:text-ink hover:shadow-sm',
              )}
              style={
                selectedCategory === key
                  ? { backgroundColor: color, borderColor: color }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content: Grid + Preview ─────────────────────────────────── */}
      <div className="flex gap-6">
        {/* ── Card Grid (left) ─────────────────────────────────── */}
        <div className="w-[340px] shrink-0">
          <div className="flex flex-col gap-3">
            {filteredIdeas.map((idea) => {
              const cat = CATEGORY_LABELS[idea.category];
              const isSelected = selectedIdea?.id === idea.id;
              return (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className={cn(
                    'text-left bg-white rounded-xl border overflow-hidden transition-all duration-300 group',
                    'hover:shadow-lg hover:-translate-y-1 hover:border-violet/40',
                    isSelected
                      ? 'border-violet shadow-lg ring-2 ring-violet/20 bg-gradient-to-r from-white to-violet-ghost/40'
                      : 'border-border/80 shadow-sm',
                  )}
                >
                  <div className="flex gap-3 p-3">
                    {/* Color accent */}
                    <div
                      className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
                      style={{ background: `linear-gradient(135deg, ${idea.imageColor}, ${idea.imageColor}88)` }}
                    >
                      <TrendingUp size={20} className="text-white/60 group-hover:text-white/90 transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
                          style={{ backgroundColor: cat?.color }}
                        >
                          {cat?.label}
                        </span>
                        <span className="text-[9px] text-ink-3 font-mono">{formatShortDate(idea.date)}</span>
                      </div>
                      <h3 className="text-[12px] font-semibold text-ink leading-snug line-clamp-2 font-body mb-1">
                        {idea.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-ink-3 font-body truncate">{idea.underlying}</span>
                        <span className="text-[13px] font-bold text-violet font-display ml-2 shrink-0">{idea.returnPct}%</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Preview Panel (right) ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {selectedIdea ? (
            <div className="bg-white rounded-xl border border-border/80 overflow-hidden shadow-sm">
              {/* Preview Header */}
              <div
                className="px-6 py-6 text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${selectedIdea.imageColor}, ${selectedIdea.imageColor}cc, ${selectedIdea.imageColor}99)` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4">
                    <Globe size={80} className="text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {CATEGORY_LABELS[selectedIdea.category]?.label}
                    </span>
                    <span className="text-[11px] text-white/70 font-body">
                      {formatDate(selectedIdea.date)}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold leading-tight mb-1">
                    {selectedIdea.title}
                  </h2>
                  <p className="text-white/70 font-body text-sm mb-3">{selectedIdea.subtitle}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-white/80 font-body">{selectedIdea.underlying}</span>
                    <span className="font-display text-3xl font-bold drop-shadow-lg">{selectedIdea.returnPct}%</span>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6 flex flex-col gap-5">
                {/* Thesis */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={15} className="text-violet" />
                    <h3 className="font-display text-sm font-bold text-ink">Thèse d&apos;investissement</h3>
                  </div>
                  <p className="text-[13px] text-ink-2 font-body leading-relaxed">
                    {selectedIdea.analysis.thesis}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {selectedIdea.analysis.keyMetrics.map((m, i) => (
                    <div key={i} className="bg-surface rounded-lg p-3 hover:bg-violet-ghost/50 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-violet/10">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-bold block mb-1">{m.label}</span>
                      <span className="text-[14px] font-bold text-violet font-display">{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Structure */}
                <div className="bg-gradient-to-br from-violet-ghost to-violet-ghost/40 rounded-lg p-4 border border-violet/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-violet" />
                    <span className="text-[12px] font-bold text-violet font-body">Structure proposée</span>
                  </div>
                  <p className="text-[12px] text-ink-2 font-body leading-relaxed">
                    {selectedIdea.analysis.structureDetails}
                  </p>
                </div>

                {/* Catalysts + Risks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-teal" />
                      <span className="text-[12px] font-bold text-ink font-body">Catalyseurs</span>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {selectedIdea.analysis.catalysts.map((c, i) => (
                        <li key={i} className="text-[11px] text-ink-2 font-body flex items-start gap-1.5">
                          <span className="text-teal mt-0.5 shrink-0">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-gold" />
                      <span className="text-[12px] font-bold text-ink font-body">Risques</span>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {selectedIdea.analysis.risks.map((r, i) => (
                        <li key={i} className="text-[11px] text-ink-2 font-body flex items-start gap-1.5">
                          <span className="text-gold mt-0.5 shrink-0">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sources */}
                <div className="border-t border-border/60 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink size={13} className="text-ink-3" />
                    <span className="text-[10px] uppercase tracking-wider text-ink-3 font-bold">Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdea.analysis.sources.map((s, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-[10px] text-ink-3 font-body hover:bg-violet-ghost hover:text-violet/80 transition-colors duration-200 cursor-default">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button className="h-9 px-4 rounded-lg bg-gradient-to-r from-violet to-violet-dark text-white text-[12px] font-semibold flex items-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                    <Download size={13} />
                    Télécharger le PDF
                  </button>
                  <button className="h-9 px-4 rounded-lg border border-border/80 text-ink-3 text-[12px] font-semibold flex items-center gap-2 hover:text-violet hover:border-violet hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                    <Share2 size={13} />
                    Partager
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white to-violet-ghost/20 rounded-xl border border-border/80 p-12 flex flex-col items-center justify-center gap-4 shadow-sm">
              <FileText size={40} className="text-ink-3/30 animate-pulse" />
              <p className="text-sm text-ink-3 font-body">
                Sélectionnez une idée de trade pour voir l&apos;aperçu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
