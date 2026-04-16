'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Globe,
  Shield,
  Zap,
  BarChart3,
  Target,
  AlertTriangle,
  ExternalLink,
  Brain,
  Sparkles,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Landmark,
  Flame,
  HeartPulse,
  Gem,
  Car,
  Radio,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';

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
  aiConfidence: number;
  aiVerdict: 'strong_buy' | 'buy' | 'hold' | 'cautious';
  analysis: {
    thesis: string;
    keyMetrics: { label: string; value: string }[];
    catalysts: string[];
    risks: string[];
    sources: string[];
    structureDetails: string;
  };
}

interface MarketIndex {
  label: string;
  value: string;
  changePct: number;
  sparkline: number[];
}

interface SectorData {
  name: string;
  changePct: number;
  icon: React.ReactNode;
}

type SortMode = 'date' | 'return' | 'confidence';
type ThemeFilter = '' | 'thematic' | 'sector' | 'macro' | 'esg';

// ─── Market Overview Data ────────────────────────────────────────────────────

const MARKET_INDICES: MarketIndex[] = [
  {
    label: 'Euro Stoxx 50',
    value: '4 892',
    changePct: 0.8,
    sparkline: [40, 42, 38, 44, 43, 46, 48, 45, 49, 50, 48, 52],
  },
  {
    label: 'CAC 40',
    value: '7 845',
    changePct: 0.5,
    sparkline: [55, 53, 56, 54, 58, 57, 59, 56, 60, 58, 61, 62],
  },
  {
    label: 'VIX',
    value: '16.2',
    changePct: -3.1,
    sparkline: [65, 62, 68, 60, 58, 63, 55, 52, 50, 48, 45, 42],
  },
  {
    label: 'EUR/USD',
    value: '1.082',
    changePct: -0.2,
    sparkline: [50, 52, 48, 51, 49, 47, 50, 48, 46, 49, 47, 45],
  },
];

// ─── Sector Heatmap Data ────────────────────────────────────────────────────

const SECTOR_DATA: SectorData[] = [
  { name: 'Technologie', changePct: 2.1, icon: <Cpu size={14} /> },
  { name: 'Banque', changePct: 1.5, icon: <Landmark size={14} /> },
  { name: 'Energie', changePct: -0.8, icon: <Flame size={14} /> },
  { name: 'Sante', changePct: 0.3, icon: <HeartPulse size={14} /> },
  { name: 'Defense', changePct: 4.2, icon: <Shield size={14} /> },
  { name: 'Luxe', changePct: -1.2, icon: <Gem size={14} /> },
  { name: 'Auto', changePct: -2.1, icon: <Car size={14} /> },
  { name: 'Telecom', changePct: 0.5, icon: <Radio size={14} /> },
];

// ─── AI Market Brief Data ───────────────────────────────────────────────────

const AI_BRIEF_BULLETS = [
  'Les marches europeens consolident pres des plus hauts annuels. L\'Euro Stoxx 50 teste la resistance des 4 900 pts avec une volatilite implicite contenue.',
  'Secteur defense en tete (+4.2% hebdo) porte par les nouveaux engagements OTAN et le fonds souverainete europeen vote la semaine derniere.',
  'Les spreads de credit des emetteurs majeurs (BNP, SG, Natixis) restent stables a 52 bps, validant la solidite du gisement autocall.',
  'Attention au risque tarifaire US : les negociations commerciales sino-americaines reprennent le 22 mars. VIX pourrait rebondir temporairement.',
];

const AI_BRIEF_CONFIDENCE = 87;
const AI_BRIEF_DATE = '15 mars 2026, 09:42';

// ─── Sentiment Data ─────────────────────────────────────────────────────────

const SENTIMENT = { bull: 45, neutral: 35, bear: 20 };

// ─── Real Financial Data (March 2026) ─────────────────────────────────────────

const TRADE_IDEAS: TradeIdea[] = [
  {
    id: '1',
    title: 'Defense Europeenne : Le Supercycle',
    subtitle: 'Phoenix Autocall -- Worst-Of',
    date: '2026-03-03',
    underlying: 'Rheinmetall / Thales',
    returnPct: 19,
    category: 'sector',
    imageColor: '#0A2799',
    aiConfidence: 91,
    aiVerdict: 'strong_buy',
    analysis: {
      thesis: 'Les budgets de defense en Europe augmentent structurellement. Les pays de l\'OTAN visent 3-5% du PIB contre 2% precedemment. La Pologne depasse 4.5% en 2025. Le STOXX Europe Aerospace & Defense Index a progresse de +65% en 2025. Rheinmetall a bondi de +200% depuis janvier 2025, portee par les commandes d\'armement terrestre. Thales est juge sous-evalue par Morningstar avec un positionnement cle en cyberdefense et avionique.',
      keyMetrics: [
        { label: 'Croissance Rheinmetall 2025', value: '+200%' },
        { label: 'STOXX A&D Index 2025', value: '+65%' },
        { label: 'Budgets defense UE /an', value: '+6.8%' },
        { label: 'Carnets de commandes', value: '+15%' },
      ],
      catalysts: [
        'Plans de rearmement europeens (Allemagne : \u20AC100Mrd fonds special)',
        'Prolongation du conflit Ukraine -- depenses munitions record',
        'BEI triple les financements defense a \u20AC3Mrd',
        'M&A en acceleration : +35% en H1 2025',
      ],
      risks: [
        'Cessez-le-feu Ukraine -> baisse temporaire du secteur',
        'Valorisations elevees (Rheinmetall P/E forward 39x)',
        'Cycles de contrats longs (10-15 ans)',
      ],
      sources: [
        'Morningstar -- European Defense Stocks Analysis 2026',
        'Fitch Ratings -- European Defense Companies',
        'STOXX Europe Total Market Aerospace & Defense Index',
      ],
      structureDetails: 'Autocall Phoenix Worst-Of sur panier Rheinmetall/Thales. Rappel anticipe si les deux titres sont >= 100% du niveau initial. Coupon memoire 19% p.a. conditionnel si aucun titre < 60%. Barriere capitale 50% a maturite. Duree max 5 ans.',
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
    aiConfidence: 87,
    aiVerdict: 'buy',
    analysis: {
      thesis: 'L\'industrie des semiconducteurs a genere $772Mrd de revenus en 2025 (+22.5%) et le consensus prevoit $975Mrd en 2026 (+26.3%). NVIDIA reste le leader inconteste de l\'IA avec Blackwell en ramp-up complet et Rubin prevu pour H2 2026. ASML a releve ses previsions : CA 2026 entre \u20AC34-39Mrd. Les depenses en serveurs IA pourraient bondir de 45% en 2026 a $312Mrd selon Bloomberg Intelligence.',
      keyMetrics: [
        { label: 'NVIDIA performance 2025', value: '+39%' },
        { label: 'ASML performance 2025', value: '+54%' },
        { label: 'Revenus secteur 2026e', value: '$975Mrd' },
        { label: 'Depenses serveurs IA 2026', value: '$312Mrd' },
      ],
      catalysts: [
        'NVIDIA Blackwell ramp-up complet -- Rubin en H2 2026',
        'ASML : carnet de commandes EUV record (\u20AC7.4Mrd Q4)',
        'Investissements hyperscalers IA en acceleration',
        'Reshoring semi-conducteurs (CHIPS Act US + EU)',
      ],
      risks: [
        'Volatilite elevee (NVIDIA beta 2.31)',
        'Restrictions export Chine -- impact sur revenus',
        'Valorisations tendues (ASML P/E forward 34x)',
      ],
      sources: [
        'Wolfe Research -- NVIDIA Top AI Pick 2026',
        'Morgan Stanley -- ASML Price Target \u20AC1,400',
        'Bloomberg Intelligence -- AI Server Spending',
        'WSTS -- Semiconductor Industry Forecast',
      ],
      structureDetails: 'Autocall Athena Worst-Of sur NVIDIA/ASML. Rappel anticipe des l\'annee 1 si les deux titres >= 100%. Gain a maturite 16% par annee ecoulee. Barriere capitale 50%. Protection partielle grace a la diversification sectorielle (design + equipement).',
    },
  },
  {
    id: '3',
    title: 'Or : Valeur Refuge & Capital Protege',
    subtitle: 'Note a Capital Protege 90%',
    date: '2026-02-05',
    underlying: 'iEdge Gold Shares EUR Index',
    returnPct: 12,
    category: 'macro',
    imageColor: '#D4A017',
    aiConfidence: 83,
    aiVerdict: 'buy',
    analysis: {
      thesis: 'L\'or a atteint $5,081/oz en mars 2026. J.P. Morgan cible $6,300 fin 2026, Goldman Sachs $5,400 et Wells Fargo $6,100-6,300. Les achats des banques centrales restent record : 95% d\'entre elles prevoient d\'augmenter leurs reserves d\'or. Les ETF or ont enregistre des flux entrants massifs. L\'incertitude geopolitique et la politique tarifaire americaine soutiennent la demande.',
      keyMetrics: [
        { label: 'Prix actuel (mars 2026)', value: '$5,081/oz' },
        { label: 'Cible JPM fin 2026', value: '$6,300/oz' },
        { label: 'Cible Goldman Sachs', value: '$5,400/oz' },
        { label: 'Achats banques centrales', value: '>1,000t/an' },
      ],
      catalysts: [
        'Banques centrales : 3eme annee > 1,000 tonnes d\'achats',
        'Tensions geopolitiques persistantes',
        'Diversification hors dollar US',
        'Offre miniere contrainte (10-20 ans pour nouvelles mines)',
      ],
      risks: [
        'Hausse des taux reels -> pression baissiere',
        'Renforcement du dollar',
        'Correction possible de 5-20% (scenario Citi)',
      ],
      sources: [
        'J.P. Morgan -- Gold Price Target $6,300',
        'World Gold Council -- Gold Outlook 2026',
        'Morgan Stanley -- Gold Rally Forecast',
        'Goldman Sachs -- Commodities Research',
      ],
      structureDetails: 'Note a capital protege 90% indexee sur iEdge Gold Shares EUR PR Index. Participation a la hausse plafonnee a 121% du nominal. Duree 3 ans. Protection du capital en cas de baisse limitee a -10%.',
    },
  },
  {
    id: '4',
    title: 'Taux EUR : Profiter du Plateau BCE',
    subtitle: 'Coupon Conditionnel -- EUR CMS 10Y',
    date: '2026-01-20',
    underlying: 'EUR CMS 10 ans',
    returnPct: 6,
    category: 'macro',
    imageColor: '#008B6E',
    aiConfidence: 78,
    aiVerdict: 'hold',
    analysis: {
      thesis: 'La BCE maintient ses taux a 2.15% (MRO) et 2.00% (facilite de depot). Le consensus Reuters prevoit des taux stables jusqu\'a mi-2026 au minimum. La courbe des taux EUR s\'est pentifiee significativement en 2025 avec une hausse de 26bp du taux 10 ans nominal OIS. L\'inflation zone euro est tombee a 1.7% en janvier 2026, sous la cible de 2%. Environnement ideal pour les produits de taux conditionnels.',
      keyMetrics: [
        { label: 'Taux BCE (depot)', value: '2.00%' },
        { label: 'Taux BCE (MRO)', value: '2.15%' },
        { label: 'Inflation zone euro', value: '1.7%' },
        { label: 'Core inflation', value: '2.2%' },
      ],
      catalysts: [
        'BCE : taux stables attendus tout au long de 2026',
        'Pentification de la courbe -- taux longs en hausse',
        'Inflation sous la cible de 2%',
        'Primes de terme en hausse structurelle',
      ],
      risks: [
        'Surprise inflationniste -> hausse de taux inattendue',
        'Risque budgetaire souverain (France, Italie)',
        'Choc geopolitique affectant les marches obligataires',
      ],
      sources: [
        'BCE -- Comptes rendus des reunions (janv-fev 2026)',
        'Reuters -- ECB Rate Poll',
        'ECB Blog -- Euro Area Yield Curve Repricing',
        'Survey of Professional Forecasters Q4 2025',
      ],
      structureDetails: 'Coupon conditionnel 6% p.a. si le taux EUR CMS 10 ans reste <= 3.20%. Capital integralement protege a maturite. Possibilite de remboursement anticipe si taux <= 2.40%. Duree 12 ans.',
    },
  },
  {
    id: '5',
    title: 'Transition Verte : Le Rebond Selectif',
    subtitle: 'Phoenix Memoire -- Clean Energy',
    date: '2025-12-10',
    underlying: 'Engie / RWE',
    returnPct: 14,
    category: 'esg',
    imageColor: '#00B894',
    aiConfidence: 74,
    aiVerdict: 'cautious',
    analysis: {
      thesis: 'Les actions d\'energie renouvelable ont rebondi de +23 points de pourcentage en 2025. Apres 9 trimestres de sorties nettes, les fonds europeens clean energy ont recu pres de \u20AC900M d\'entrees au Q4 2025. La narration a evolue : securite energetique, competitivite industrielle et electrification IA dominent. RWE est identifiee comme beneficiaire cle du mix transition + independance europeenne.',
      keyMetrics: [
        { label: 'Rebond clean energy 2025', value: '+23pp' },
        { label: 'Flux fonds Q4 2025', value: '\u20AC900M' },
        { label: 'Croissance capacite renouvelable', value: '+15%/an' },
        { label: 'Mecanisme CBAM UE', value: 'Actif' },
      ],
      catalysts: [
        'Demande electricite IA -> besoin infrastructures vertes',
        'CBAM europeen renforce la competitivite verte',
        'RWE : sortie du charbon + build-out renouvelable massif',
        'Directive Omnibus UE adoptee (fev. 2026)',
      ],
      risks: [
        'Taux eleves -> cout de financement des projets',
        'Retards de permitting et interconnexion reseau',
        'Volatilite des rendements projets',
      ],
      sources: [
        'Morningstar -- Are Renewable Energy Stocks a Buy in 2026',
        'LSEG -- Sustainable Investment Context 2026',
        'Franklin Templeton -- ESG 2026 Outlook',
        'World Gold Council -- Energy Transition',
      ],
      structureDetails: 'Phoenix a memoire sur panier Engie/RWE. Coupon 14% p.a. avec effet memoire si les deux titres >= 65% du niveau initial. Barriere capitale 50%. Rappel anticipe possible des l\'annee 2.',
    },
  },
  {
    id: '6',
    title: 'Autocalls Europe : Track Record Exceptionnel',
    subtitle: 'Phoenix Autocall -- Euro Stoxx 50',
    date: '2025-11-15',
    underlying: 'Euro Stoxx 50',
    returnPct: 8,
    category: 'thematic',
    imageColor: '#5535C4',
    aiConfidence: 93,
    aiVerdict: 'strong_buy',
    analysis: {
      thesis: 'En 2025, 338 autocalls UK capital-at-risk lies au FTSE ont mature : 100% ont rapporte capital + profit. Le rendement annualise moyen etait de 7.85%. Sur la decennie 2016-2025, plus de 2,000 maturites avec 99.7% de rendements positifs et zero perte en capital. Le sentiment sur les produits structures est au plus haut : 85% des professionnels sont optimistes ou tres optimistes.',
      keyMetrics: [
        { label: 'Autocalls UK matures 2025', value: '338 (100% +)' },
        { label: 'Rendement moyen annualise', value: '7.85%' },
        { label: 'Track record 10 ans', value: '99.7% positif' },
        { label: 'Duree de vie moyenne', value: '2.3 ans' },
      ],
      catalysts: [
        'Euro Stoxx 50 proche des plus hauts historiques',
        'Momentum beneficiaire : +13% attendu en 2026',
        'Conditions de marche favorables au rappel anticipe',
        'BNP Paribas innove : structure "Catapult" a upside x1.5',
      ],
      risks: [
        'Correction de marche -> extension de la duree de vie',
        'Tarifs douaniers US -> volatilite accrue (VIX +40% en avril 2025)',
        'Risque de contrepartie bancaire',
      ],
      sources: [
        'SRP -- Global Market Sentiment Survey 2025/2026',
        'IDAD -- Autocall Track Record Analysis',
        'Risk.net -- BNP Paribas Structured Products House of the Year',
        'Morgan Stanley -- 2026 Market Outlook',
      ],
      structureDetails: 'Phoenix Autocall classique sur Euro Stoxx 50. Coupon 8% p.a. si indice >= 70% du niveau initial. Rappel anticipe des l\'annee 1 si indice >= 100%. Barriere capitale 60% de type europeenne. Duree max 10 ans.',
    },
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  thematic: { label: 'Thematique', color: '#3B1FA8' },
  sector: { label: 'Sectoriel', color: '#0A2799' },
  macro: { label: 'Macro', color: '#D4A017' },
  esg: { label: 'ESG', color: '#00B894' },
};

const AI_VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: 'Achat fort', color: '#00B894', bg: '#00B89415' },
  buy: { label: 'Achat', color: '#3B1FA8', bg: '#3B1FA815' },
  hold: { label: 'Conserver', color: '#D4A017', bg: '#D4A01715' },
  cautious: { label: 'Prudence', color: '#E8334A', bg: '#E8334A15' },
};

const AI_MARKET_BRIEF = {
  sentiment: 'Haussier' as const,
  sentimentScore: 72,
  lastUpdate: 'il y a 8 min',
  summary: 'Les marches europeens consolident pres des plus hauts. L\'Euro Stoxx 50 teste la resistance des 5 100 pts avec une volatilite implicite contenue a 17.8%. Les conditions sont favorables aux emissions d\'autocalls (vol implicite > vol realisee). Les spreads de credit des emetteurs majeurs (BNP, SG, Natixis) restent stables, validant la solidite du gisement. Attention au risque tarifaire US qui pourrait generer un pic de volatilite ponctuel.',
  keyData: [
    { label: 'Euro Stoxx 50', value: '5 042 pts', change: '+0.8%', up: true },
    { label: 'Vol. implicite 1M', value: '17.8%', change: '-1.2 pts', up: false },
    { label: 'EUR CMS 10Y', value: '2.64%', change: '+3 bps', up: true },
    { label: 'iTraxx Europe', value: '52 bps', change: '-2 bps', up: false },
    { label: 'Or (XAU/USD)', value: '$5 081', change: '+1.4%', up: true },
    { label: 'EUR/USD', value: '1.0842', change: '-0.2%', up: false },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Mini CSS sparkline rendered as inline SVG */
function MiniSparkline({ data, color, width = 64, height = 20 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-60">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sector performance color from green to red */
function sectorColor(pct: number): string {
  if (pct >= 3) return '#00B894';
  if (pct >= 1) return '#00B894cc';
  if (pct >= 0) return '#00B89466';
  if (pct >= -1) return '#E8334A66';
  return '#E8334A';
}

function sectorBg(pct: number): string {
  if (pct >= 3) return 'rgba(0,184,148,0.12)';
  if (pct >= 1) return 'rgba(0,184,148,0.08)';
  if (pct >= 0) return 'rgba(0,184,148,0.04)';
  if (pct >= -1) return 'rgba(232,51,74,0.04)';
  return 'rgba(232,51,74,0.08)';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  useEffect(() => { document.title = "Research & Analyse | Strick'in"; }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ThemeFilter>('');
  const [selectedIdea, setSelectedIdea] = useState<TradeIdea | null>(TRADE_IDEAS[0]!);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const currentFeatured = TRADE_IDEAS[featuredIndex]!;

  const handleDownloadTxt = useCallback((idea: TradeIdea) => {
    const verdict = AI_VERDICT_CONFIG[idea.aiVerdict]?.label ?? idea.aiVerdict;
    const lines = [
      `════════════════════════════════════════`,
      `  STRICK'IN RESEARCH`,
      `════════════════════════════════════════`,
      ``,
      `Titre       : ${idea.title}`,
      `Sous-titre  : ${idea.subtitle}`,
      `Date        : ${formatDate(idea.date)}`,
      `Sous-jacent : ${idea.underlying}`,
      `Rendement   : ${idea.returnPct}%`,
      `Confiance IA: ${idea.aiConfidence}%`,
      `Verdict IA  : ${verdict}`,
      ``,
      `── These d'investissement ──────────────`,
      idea.analysis.thesis,
      ``,
      `── Metriques cles ─────────────────────`,
      ...idea.analysis.keyMetrics.map((m) => `  ${m.label}: ${m.value}`),
      ``,
      `── Catalyseurs ────────────────────────`,
      ...idea.analysis.catalysts.map((c) => `  * ${c}`),
      ``,
      `── Risques ────────────────────────────`,
      ...idea.analysis.risks.map((r) => `  * ${r}`),
      ``,
      `── Structure proposee ─────────────────`,
      idea.analysis.structureDetails,
      ``,
      `── Sources ────────────────────────────`,
      ...idea.analysis.sources.map((s) => `  * ${s}`),
      ``,
      `════════════════════════════════════════`,
      `  Genere par Strick'in Research`,
      `════════════════════════════════════════`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strickin-research-${slug}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleShare = useCallback(async (idea: TradeIdea) => {
    const text = `Strick'in Research - ${idea.title}\n${idea.subtitle}\nRendement: ${idea.returnPct}%\nSous-jacent: ${idea.underlying}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Strick'in - ${idea.title}`, text });
      } catch {
        /* user cancelled share dialog */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  }, []);

  const filteredAndSortedIdeas = useMemo(() => {
    const filtered = TRADE_IDEAS.filter((idea) => {
      const matchesSearch =
        !searchQuery ||
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.underlying.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || idea.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered];
    switch (sortMode) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'return':
        sorted.sort((a, b) => b.returnPct - a.returnPct);
        break;
      case 'confidence':
        sorted.sort((a, b) => b.aiConfidence - a.aiConfidence);
        break;
    }
    return sorted;
  }, [searchQuery, selectedCategory, sortMode]);

  return (
    <div className="animate-fade-in">

      {/* ================================================================== */}
      {/* 1. MARKET OVERVIEW -- KPI Cards                                     */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {MARKET_INDICES.map((idx) => {
          const isUp = idx.changePct >= 0;
          return (
            <div
              key={idx.label}
              className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm hover:shadow-md hover:shadow-violet/5 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: isUp ? 'linear-gradient(90deg, #00B894, #00B89466)' : 'linear-gradient(90deg, #E8334A, #E8334A66)' }}
              />
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-bold font-body">{idx.label}</span>
                  <div className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold',
                    isUp ? 'bg-teal/10 text-teal' : 'bg-red/10 text-red',
                  )}>
                    {isUp ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                    {isUp ? '+' : ''}{idx.changePct}%
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-display text-xl font-bold text-ink tabular-nums">{idx.value}</span>
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline data={idx.sparkline} color={isUp ? '#00B894' : '#E8334A'} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* 2. MARKET SENTIMENT BAR                                             */}
      {/* ================================================================== */}
      <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden mb-4 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-violet" />
            <span className="text-[11px] font-bold text-ink font-body">Sentiment de marche -- Mars 2026</span>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-body font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal" />
              <span className="text-ink-3">Bull {SENTIMENT.bull}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gold" />
              <span className="text-ink-3">Neutre {SENTIMENT.neutral}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red" />
              <span className="text-ink-3">Bear {SENTIMENT.bear}%</span>
            </span>
          </div>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-2">
          <div
            className="h-full rounded-l-full transition-all duration-700"
            style={{ width: `${SENTIMENT.bull}%`, background: 'linear-gradient(90deg, #00B894, #00B894cc)' }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${SENTIMENT.neutral}%`, background: 'linear-gradient(90deg, #D4A017cc, #D4A017)' }}
          />
          <div
            className="h-full rounded-r-full transition-all duration-700"
            style={{ width: `${SENTIMENT.bear}%`, background: 'linear-gradient(90deg, #E8334Acc, #E8334A)' }}
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. SECTOR HEATMAP + AI MARKET BRIEF (side by side)                  */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
        {/* Sector Heatmap -- 3 cols */}
        <div className="lg:col-span-3 relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3B1FA8, #3D63F5, #00B894)' }} />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-cobalt/10">
                <BarChart3 size={12} className="text-cobalt" />
              </div>
              <h2 className="font-display text-[13px] font-bold text-ink">Heatmap Sectorielle</h2>
              <span className="text-[9px] text-ink-3 font-body ml-auto">Performance hebdomadaire</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SECTOR_DATA.map((sector) => {
                const isUp = sector.changePct >= 0;
                return (
                  <div
                    key={sector.name}
                    className="relative rounded-lg border border-border/30 p-2.5 flex flex-col items-center gap-1 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group"
                    style={{ backgroundColor: sectorBg(sector.changePct), borderColor: `${sectorColor(sector.changePct)}30` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: `${sectorColor(sector.changePct)}18`, color: sectorColor(sector.changePct) }}
                    >
                      {sector.icon}
                    </div>
                    <span className="text-[10px] font-bold text-ink font-body text-center leading-tight">{sector.name}</span>
                    <span
                      className="text-[12px] font-display font-bold tabular-nums"
                      style={{ color: sectorColor(sector.changePct) }}
                    >
                      {isUp ? '+' : ''}{sector.changePct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Market Brief -- 2 cols */}
        <div className="lg:col-span-2 relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4)' }} />
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #3B1FA8 0%, #5B3FD4 100%)' }}
              >
                <Brain size={12} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-[13px] font-bold text-ink leading-tight">Analyse IA -- Strick&apos;in Intelligence</h2>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet/10">
                <Sparkles size={9} className="text-violet" />
                <span className="text-[9px] font-bold text-violet font-mono">{AI_BRIEF_CONFIDENCE}%</span>
              </div>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {AI_BRIEF_BULLETS.map((bullet, i) => (
                <li key={i} className="text-[10px] text-ink-2 font-body leading-relaxed flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet/40 mt-1 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/30">
              <Clock size={9} className="text-ink-3" />
              <span className="text-[9px] text-ink-3 font-body">Genere le {AI_BRIEF_DATE}</span>
            </div>
          </div>
        </div>
      </div>

      <PageHeader
        icon={Brain}
        title="Research & Trade Ideas"
        subtitle={`Synthese IA du marche -- mise a jour ${AI_MARKET_BRIEF.lastUpdate}`}
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
        className="mb-4"
      />

      {/* ================================================================== */}
      {/* 4. LIVE MARKET DATA TICKER                                          */}
      {/* ================================================================== */}
      <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden mb-4 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894, #D4A017)' }} />
        <div className="p-4">

          <p className="text-[11px] text-ink-2 font-body leading-relaxed mb-3">{AI_MARKET_BRIEF.summary}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {AI_MARKET_BRIEF.keyData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 py-1.5 px-1.5 rounded-lg bg-surface-2/40 dark:bg-white/[0.03] border border-border/30 hover:border-violet/20 hover:shadow-sm transition-all duration-200">
                <span className="text-[8px] uppercase tracking-wider text-ink-3 font-bold">{d.label}</span>
                <span className="font-mono text-[12px] font-bold text-ink tabular-nums">{d.value}</span>
                <span className={cn(
                  'flex items-center gap-0.5 text-[9px] font-mono font-semibold tabular-nums',
                  d.up ? 'text-teal' : 'text-red',
                )}>
                  {d.up ? <TrendingUp size={8} /> : <Activity size={8} />}
                  {d.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. FEATURED CAROUSEL                                                */}
      {/* ================================================================== */}
      <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden mb-4 shadow-sm hover:shadow-md hover:shadow-violet/5 transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-b-full opacity-80" style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4, #3D63F5)' }} />
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFeaturedIndex((i) => Math.max(0, i - 1))}
              disabled={featuredIndex === 0}
              className={cn(
                'shrink-0 w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center',
                'text-ink-3 hover:text-[#3B1FA8] hover:border-[#3B1FA8] hover:bg-[#3B1FA8]/5',
                'hover:shadow-sm hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100',
              )}
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex-1 flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] text-[#3B1FA8] font-bold font-body uppercase tracking-[0.15em] mb-0.5">
                  {formatDate(currentFeatured.date)}
                </p>
                <h2 className="font-display text-base font-bold text-ink leading-snug">
                  {currentFeatured.title}
                </h2>
                <p className="text-[11px] text-ink-3 font-body">{currentFeatured.subtitle}</p>
              </div>
              <p className="font-display text-2xl font-bold bg-gradient-to-r from-[#3B1FA8] to-[#00B894] bg-clip-text text-transparent shrink-0">
                {currentFeatured.returnPct}%
              </p>
            </div>

            <button
              onClick={() => setFeaturedIndex((i) => Math.min(TRADE_IDEAS.length - 1, i + 1))}
              disabled={featuredIndex === TRADE_IDEAS.length - 1}
              className={cn(
                'shrink-0 w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center',
                'text-ink-3 hover:text-[#3B1FA8] hover:border-[#3B1FA8] hover:bg-[#3B1FA8]/5',
                'hover:shadow-sm hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100',
              )}
            >
              <ChevronRight size={14} />
            </button>

            <div className="shrink-0 flex items-center gap-2 border-l border-border/40 pl-4">
              <button
                onClick={() => handleDownloadTxt(currentFeatured)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] text-ink-3 font-body font-medium',
                  'hover:text-[#3B1FA8] hover:translate-x-0.5 transition-all duration-200',
                )}
              >
                <Download size={12} />
                PDF
              </button>
              <button
                onClick={() => handleShare(currentFeatured)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] text-ink-3 font-body font-medium',
                  'hover:text-[#3B1FA8] hover:translate-x-0.5 transition-all duration-200',
                )}
              >
                <Share2 size={12} />
                {shareSuccess ? 'Copie !' : 'Partager'}
              </button>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-1 mt-2">
            {TRADE_IDEAS.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeaturedIndex(i)}
                className={cn(
                  'rounded-full transition-all duration-200',
                  i === featuredIndex
                    ? 'w-5 h-1 bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4]'
                    : 'w-1 h-1 bg-ink-3/20 hover:bg-ink-3/40',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 6. ENHANCED SEARCH, FILTERS & SORT TOOLBAR                          */}
      {/* ================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/40 px-2.5 py-2 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className={cn(
              'w-full h-7 rounded-lg border border-border/40 bg-white/70 dark:bg-white/10 backdrop-blur-sm pl-7 pr-3',
              'text-[11px] font-body text-ink',
              'placeholder:text-ink-3/50 transition-all duration-200',
              'focus:outline-none focus:ring-1 focus:ring-[#3B1FA8]/15 focus:border-[#3B1FA8]',
            )}
          />
        </div>

        <div className="h-4 w-px bg-border/40 hidden sm:block" />

        {/* Theme Filter Row */}
        <div className="flex items-center gap-1">
          <SlidersHorizontal size={10} className="text-ink-3 mr-0.5" />
          <button
            onClick={() => setSelectedCategory('')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] font-semibold font-body transition-all duration-200',
              'hover:scale-[1.03] active:scale-[0.97]',
              !selectedCategory
                ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-sm shadow-violet/20'
                : 'text-ink-3 hover:text-ink hover:bg-surface-2/60',
            )}
          >
            Tous
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? '' : key as ThemeFilter)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-semibold font-body transition-all duration-200',
                'hover:scale-[1.03] active:scale-[0.97]',
                selectedCategory === key
                  ? 'text-white shadow-sm'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2/60',
              )}
              style={
                selectedCategory === key
                  ? { backgroundColor: color, boxShadow: `0 2px 8px ${color}33` }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border/40 hidden sm:block" />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown size={10} className="text-ink-3 mr-0.5" />
          {([
            { key: 'date' as const, label: 'Par date' },
            { key: 'return' as const, label: 'Par rendement' },
            { key: 'confidence' as const, label: 'Par confiance IA' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={cn(
                'px-2 py-1 rounded-lg text-[10px] font-semibold font-body transition-all duration-200',
                'hover:scale-[1.03] active:scale-[0.97]',
                sortMode === key
                  ? 'bg-ink/8 text-ink border border-border/60'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-2/60',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 7. CONTENT: Card Grid + Preview Panel                               */}
      {/* ================================================================== */}
      <div className="flex gap-3">
        {/* ── Card Grid (left) ─────────────────────────────────── */}
        <div className="w-[300px] shrink-0">
          <div className="flex flex-col gap-2 stagger-children">
            {filteredAndSortedIdeas.map((idea) => {
              const cat = CATEGORY_LABELS[idea.category];
              const isSelected = selectedIdea?.id === idea.id;
              return (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className={cn(
                    'group text-left bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg border ring-1 ring-black/[0.03]',
                    'overflow-hidden transition-all duration-200',
                    'hover:shadow-md hover:shadow-violet/5 hover:-translate-y-0.5 hover:border-violet/40',
                    isSelected
                      ? 'border-[#3B1FA8] shadow-md ring-[#3B1FA8]/20 bg-gradient-to-r from-white to-[#3B1FA8]/3 dark:from-white/5 dark:to-[#3B1FA8]/5'
                      : 'border-border/60 shadow-sm',
                  )}
                >
                  <div className="flex gap-2.5 p-2.5">
                    {/* Color accent */}
                    <div
                      className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                      style={{ background: `linear-gradient(135deg, ${idea.imageColor}, ${idea.imageColor}88)` }}
                    >
                      <TrendingUp size={16} className="text-white/60 group-hover:text-white/90 transition-colors duration-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className="inline-flex items-center px-1 py-px rounded text-[7px] font-bold text-white"
                          style={{ backgroundColor: cat?.color }}
                        >
                          {cat?.label}
                        </span>
                        <span className="text-[8px] text-ink-3 font-mono">{formatShortDate(idea.date)}</span>
                      </div>
                      <h3 className="text-[11px] font-semibold text-ink leading-snug line-clamp-1 font-body mb-0.5">
                        {idea.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-ink-3 font-body truncate">{idea.underlying}</span>
                        <span className="text-[13px] font-bold text-[#3B1FA8] font-display ml-2 shrink-0">{idea.returnPct}%</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="flex items-center gap-0.5 text-[8px] font-bold rounded px-1 py-px" style={{ backgroundColor: AI_VERDICT_CONFIG[idea.aiVerdict]?.bg, color: AI_VERDICT_CONFIG[idea.aiVerdict]?.color }}>
                          <Sparkles size={7} />
                          {AI_VERDICT_CONFIG[idea.aiVerdict]?.label}
                        </span>
                        <span className="text-[8px] font-mono text-ink-3">IA {idea.aiConfidence}%</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredAndSortedIdeas.length === 0 && (
              <div className="bg-white/60 dark:bg-white/5 rounded-lg border border-border/40 p-6 text-center">
                <Search size={20} className="text-ink-3/30 mx-auto mb-2" />
                <p className="text-[11px] text-ink-3 font-body">Aucun resultat pour cette recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Preview Panel (right) ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {selectedIdea ? (
            <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
              {/* Preview Header */}
              <div
                className="px-4 py-3.5 text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${selectedIdea.imageColor}, ${selectedIdea.imageColor}cc, ${selectedIdea.imageColor}99)` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-3">
                    <Globe size={56} className="text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/20 text-white backdrop-blur-sm">
                      {CATEGORY_LABELS[selectedIdea.category]?.label}
                    </span>
                    <span className="text-[10px] text-white/70 font-body">
                      {formatDate(selectedIdea.date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold leading-tight">
                        {selectedIdea.title}
                      </h2>
                      <p className="text-white/70 font-body text-[11px]">{selectedIdea.subtitle} -- {selectedIdea.underlying}</p>
                    </div>
                    <span className="font-display text-2xl font-bold drop-shadow-lg shrink-0 ml-3">{selectedIdea.returnPct}%</span>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-4 flex flex-col gap-3">
                {/* Thesis */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-[#3B1FA8]/8">
                      <FileText size={11} className="text-[#3B1FA8]" />
                    </div>
                    <h3 className="font-display text-[12px] font-bold text-ink">These d&apos;investissement</h3>
                  </div>
                  <p className="text-[11px] text-ink-2 font-body leading-relaxed">
                    {selectedIdea.analysis.thesis}
                  </p>
                </div>

                {/* AI Verdict */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-violet/15 bg-gradient-to-r from-violet/[0.04] to-transparent">
                  <div className="flex items-center gap-1.5">
                    <Brain size={13} className="text-violet" />
                    <span className="text-[10px] font-bold text-ink font-body">Verdict IA :</span>
                    <span
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: AI_VERDICT_CONFIG[selectedIdea.aiVerdict]?.bg, color: AI_VERDICT_CONFIG[selectedIdea.aiVerdict]?.color }}
                    >
                      <Sparkles size={9} />
                      {AI_VERDICT_CONFIG[selectedIdea.aiVerdict]?.label}
                    </span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-ink-3 font-body">Confiance</span>
                    <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${selectedIdea.aiConfidence}%`,
                          background: `linear-gradient(90deg, ${AI_VERDICT_CONFIG[selectedIdea.aiVerdict]?.color}, ${AI_VERDICT_CONFIG[selectedIdea.aiVerdict]?.color}88)`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: AI_VERDICT_CONFIG[selectedIdea.aiVerdict]?.color }}>
                      {selectedIdea.aiConfidence}%
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {selectedIdea.analysis.keyMetrics.map((m, i) => (
                    <div key={i} className="p-2 rounded-lg bg-surface-2/40 border border-border/30 hover:bg-[#3B1FA8]/3 hover:border-[#3B1FA8]/10 hover:shadow-sm transition-all duration-200">
                      <span className="text-[8px] uppercase tracking-[0.12em] text-ink-3 font-bold block mb-0.5">{m.label}</span>
                      <span className="text-[12px] font-bold text-[#3B1FA8] font-display">{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Structure */}
                <div className="bg-gradient-to-br from-[#3B1FA8]/5 to-[#3B1FA8]/2 rounded-lg p-3 border border-[#3B1FA8]/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-[#3B1FA8]/10">
                      <Target size={10} className="text-[#3B1FA8]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#3B1FA8] font-body">Structure proposee</span>
                  </div>
                  <p className="text-[11px] text-ink-2 font-body leading-relaxed">
                    {selectedIdea.analysis.structureDetails}
                  </p>
                </div>

                {/* Catalysts + Risks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00B894]/10">
                        <Zap size={10} className="text-[#00B894]" />
                      </div>
                      <span className="text-[11px] font-bold text-ink font-body">Catalyseurs</span>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {selectedIdea.analysis.catalysts.map((c, i) => (
                        <li key={i} className="text-[10px] text-ink-2 font-body flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#00B894] mt-1.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-[#D4A017]/10">
                        <AlertTriangle size={10} className="text-[#D4A017]" />
                      </div>
                      <span className="text-[11px] font-bold text-ink font-body">Risques</span>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {selectedIdea.analysis.risks.map((r, i) => (
                        <li key={i} className="text-[10px] text-ink-2 font-body flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#D4A017] mt-1.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sources */}
                <div className="border-t border-border/40 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ExternalLink size={11} className="text-ink-3" />
                    <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-bold">Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIdea.analysis.sources.map((s, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-surface-2/40 border border-border/30 text-[9px] text-ink-3 font-body hover:bg-[#3B1FA8]/3 hover:text-[#3B1FA8]/80 hover:border-[#3B1FA8]/10 transition-all duration-200 cursor-default">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDownloadTxt(selectedIdea)}
                    className={cn(
                      'h-8 px-4 rounded-lg font-body text-[11px] font-semibold inline-flex items-center gap-1.5',
                      'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-sm shadow-violet/20',
                      'hover:shadow-md hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    )}
                  >
                    <Download size={11} />
                    Telecharger le PDF
                  </button>
                  <button
                    onClick={() => handleShare(selectedIdea)}
                    className={cn(
                      'h-8 px-4 rounded-lg border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
                      'font-body text-[11px] font-semibold text-ink-2 inline-flex items-center gap-1.5',
                      'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-sm hover:shadow-violet/10',
                      'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    )}
                  >
                    <Share2 size={11} />
                    {shareSuccess ? 'Copie !' : 'Partager'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/60 ring-1 ring-black/[0.03] p-8 flex flex-col items-center justify-center gap-3 shadow-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-b-full opacity-40" style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4, #3D63F5)' }} />
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#5B3FD4]/5 flex items-center justify-center">
                <FileText size={22} className="text-ink-3/30" />
              </div>
              <p className="text-[12px] text-ink-3 font-body">
                Selectionnez une idee de trade pour voir l&apos;apercu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
