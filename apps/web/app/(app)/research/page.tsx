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
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_IDEAS: TradeIdea[] = [
  {
    id: '1',
    title: 'Intelligence Artificielle & Infrastructure',
    subtitle: 'Athena Worst-Of',
    date: '2026-02-19',
    underlying: 'NVIDIA / ASML',
    returnPct: 19,
    category: 'thematic',
    imageColor: '#0A2799',
  },
  {
    id: '2',
    title: 'Infrastructure Eau : Un Marché en Croissance',
    subtitle: 'Phoenix Autocall',
    date: '2025-11-13',
    underlying: 'Veolia / Xylem',
    returnPct: 12,
    category: 'esg',
    imageColor: '#00B894',
  },
  {
    id: '3',
    title: 'IA & Transformation Industrielle',
    subtitle: 'Autocall Classic',
    date: '2025-10-23',
    underlying: 'Siemens / Schneider',
    returnPct: 15,
    category: 'sector',
    imageColor: '#3B1FA8',
  },
  {
    id: '4',
    title: 'Vieillissement & Économie Silver',
    subtitle: 'Capital Protégé',
    date: '2025-10-06',
    underlying: 'Essilor / Roche',
    returnPct: 8,
    category: 'macro',
    imageColor: '#D4A017',
  },
  {
    id: '5',
    title: 'Transition Énergétique Europe',
    subtitle: 'Phoenix Mémoire',
    date: '2025-09-15',
    underlying: 'Engie / TotalEnergies',
    returnPct: 14,
    category: 'esg',
    imageColor: '#008B6E',
  },
  {
    id: '6',
    title: 'Semiconducteurs & Supply Chain',
    subtitle: 'Athena Autocall',
    date: '2025-08-22',
    underlying: 'ASML / TSMC',
    returnPct: 16,
    category: 'thematic',
    imageColor: '#5535C4',
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
  const [selectedIdea, setSelectedIdea] = useState<TradeIdea | null>(MOCK_IDEAS[0]);

  const featured = MOCK_IDEAS[0];
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const currentFeatured = MOCK_IDEAS[featuredIndex];

  const filteredIdeas = MOCK_IDEAS.filter((idea) => {
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
        <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
          Research & Trade Ideas
        </h1>
        <p className="text-sm text-ink-3 font-body mt-1">
          Découvrez nos idées de trade et analyses de marché pour vos produits structurés.
        </p>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* ── Featured Carousel ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border/80 p-6 mb-6">
        <div className="flex items-center gap-6">
          {/* Navigation */}
          <button
            onClick={() => setFeaturedIndex((i) => Math.max(0, i - 1))}
            disabled={featuredIndex === 0}
            className="shrink-0 w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet transition-all disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Content */}
          <div className="flex-1 text-center">
            <p className="text-[11px] text-violet font-semibold font-body uppercase tracking-wider mb-2">
              {formatDate(currentFeatured.date)}
            </p>
            <h2 className="font-display text-xl font-bold text-ink leading-snug mb-1">
              {currentFeatured.title}
            </h2>
            <p className="text-sm text-ink-3 font-body">{currentFeatured.subtitle}</p>
            <p className="font-display text-2xl font-bold text-violet mt-2">
              {currentFeatured.returnPct}%
            </p>
          </div>

          {/* Navigation */}
          <button
            onClick={() => setFeaturedIndex((i) => Math.min(MOCK_IDEAS.length - 1, i + 1))}
            disabled={featuredIndex === MOCK_IDEAS.length - 1}
            className="shrink-0 w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet transition-all disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>

          {/* Actions */}
          <div className="shrink-0 flex flex-col gap-2 border-l border-border/60 pl-6">
            <button className="flex items-center gap-2 text-[12px] text-ink-3 hover:text-violet transition-colors font-body">
              <Download size={14} />
              Télécharger
            </button>
            <button className="flex items-center gap-2 text-[12px] text-ink-3 hover:text-violet transition-colors font-body">
              <Share2 size={14} />
              Partager
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une idée de trade…"
            className={cn(
              'w-full h-9 rounded-lg border border-border/80 bg-white pl-9 pr-3 text-[13px] font-body text-ink',
              'placeholder:text-ink-3/60 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet',
            )}
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-150',
              !selectedCategory
                ? 'bg-violet text-white'
                : 'bg-white border border-border/80 text-ink-3 hover:text-ink',
            )}
          >
            Tous
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? '' : key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-semibold font-body transition-all duration-150 border',
                selectedCategory === key
                  ? 'text-white border-transparent'
                  : 'bg-white border-border/80 text-ink-3 hover:text-ink',
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Card Grid ────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {filteredIdeas.map((idea) => {
              const cat = CATEGORY_LABELS[idea.category];
              const isSelected = selectedIdea?.id === idea.id;
              return (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className={cn(
                    'text-left bg-white rounded-xl border overflow-hidden transition-all duration-200',
                    'hover:shadow-card hover:-translate-y-0.5',
                    isSelected
                      ? 'border-violet shadow-card ring-2 ring-violet/20'
                      : 'border-border/80',
                  )}
                >
                  {/* Color banner */}
                  <div
                    className="h-28 w-full relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${idea.imageColor}, ${idea.imageColor}88)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TrendingUp size={40} className="text-white/20" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        {cat.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-[10px] text-ink-3 font-body mb-1">
                      {formatShortDate(idea.date)}
                    </p>
                    <h3 className="text-[12px] font-semibold text-ink leading-snug line-clamp-2 font-body">
                      {idea.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-ink-3 font-body">{idea.underlying}</span>
                      <span className="text-[12px] font-bold text-violet font-display">{idea.returnPct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Preview Panel ────────────────────────────────────── */}
        <div className="lg:col-span-3">
          {selectedIdea ? (
            <div className="bg-white rounded-xl border border-border/80 overflow-hidden sticky top-4">
              {/* Preview Header */}
              <div
                className="px-6 py-8 text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${selectedIdea.imageColor}, ${selectedIdea.imageColor}cc)` }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4">
                    <Globe size={100} className="text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white mb-3">
                    {CATEGORY_LABELS[selectedIdea.category]?.label}
                  </span>
                  <h2 className="font-display text-2xl font-bold leading-tight mb-2">
                    {selectedIdea.title}
                  </h2>
                  <p className="text-white/70 font-body text-sm">{selectedIdea.subtitle}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="flex items-center gap-1 text-[12px] text-white/80 font-body">
                      <Calendar size={12} />
                      {formatDate(selectedIdea.date)}
                    </span>
                    <span className="font-display text-3xl font-bold">{selectedIdea.returnPct}%</span>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-violet" />
                  <h3 className="font-display text-sm font-bold text-ink">Analyse détaillée</h3>
                </div>

                {/* Placeholder for PDF viewer */}
                <div className="border border-border/60 rounded-lg p-8 bg-surface flex flex-col items-center justify-center gap-4 min-h-[300px]">
                  <div className="w-16 h-16 rounded-full bg-violet-ghost flex items-center justify-center">
                    <FileText size={28} className="text-violet/40" />
                  </div>
                  <p className="text-sm text-ink-3 font-body text-center">
                    Aperçu du document de recherche
                  </p>
                  <p className="text-[11px] text-ink-3/60 font-body text-center max-w-xs">
                    Le document complet sera disponible au téléchargement une fois connecté aux sources de recherche.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="h-9 px-4 rounded-lg bg-violet text-white text-[12px] font-semibold flex items-center gap-2 hover:bg-violet-dark transition-colors">
                      <Download size={13} />
                      Télécharger le PDF
                    </button>
                    <button className="h-9 px-4 rounded-lg border border-border/80 text-ink-3 text-[12px] font-semibold flex items-center gap-2 hover:text-violet hover:border-violet transition-colors">
                      <Share2 size={13} />
                      Partager
                    </button>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-surface rounded-lg p-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-ink-3 font-bold block mb-1">Sous-jacent</span>
                    <span className="text-[13px] font-semibold text-ink">{selectedIdea.underlying}</span>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-ink-3 font-bold block mb-1">Rendement cible</span>
                    <span className="text-[13px] font-bold text-violet">{selectedIdea.returnPct}%</span>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-ink-3 font-bold block mb-1">Catégorie</span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: CATEGORY_LABELS[selectedIdea.category]?.color }}
                    >
                      {CATEGORY_LABELS[selectedIdea.category]?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border/80 p-12 flex flex-col items-center justify-center gap-4">
              <FileText size={40} className="text-ink-3/30" />
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
