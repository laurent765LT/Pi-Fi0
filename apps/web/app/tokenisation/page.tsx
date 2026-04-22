'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Zap,
  Scale,
  TrendingUp,
  ArrowRight,
  Check,
  Bell,
  Shield,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { OnChainSettlementFlow } from '@/components/tokenisation/OnChainSettlementFlow';
import { TokenizationBadge } from '@/components/tokenisation/TokenizationBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoadmapMilestone {
  date: string;
  title: string;
  description: string;
  status: 'done' | 'in-progress' | 'planned';
}

interface Advantage {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

interface Partner {
  name: string;
  subtitle: string;
  initials: string;
  gradient: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROADMAP: RoadmapMilestone[] = [
  {
    date: 'Q1 2026',
    title: 'POC Canton (SG-FORGE)',
    description:
      'Premier proof-of-concept sur la blockchain Canton Network, en partenariat avec SG-FORGE pour valider le règlement instantané.',
    status: 'in-progress',
  },
  {
    date: 'Q3 2026',
    title: 'Premier produit tokenisé BNP AssetFoundry',
    description:
      'Lancement du premier produit structuré tokenisé sur la plateforme AssetFoundry de BNP Paribas, souscrivable dès 50€.',
    status: 'planned',
  },
  {
    date: 'Q1 2027',
    title: 'Ouverture progressive du catalogue',
    description:
      'Extension progressive à l\'ensemble du catalogue Strick\'in, avec un marché secondaire on-chain pour la liquidité.',
    status: 'planned',
  },
];

const ADVANTAGES: Advantage[] = [
  {
    icon: Zap,
    title: 'Règlement instantané',
    description:
      'Fini le T+2. Le règlement-livraison s\'effectue en quelques secondes directement on-chain, libérant immédiatement le capital.',
    accent: '#3B1FA8',
  },
  {
    icon: Scale,
    title: 'Micro-unitarisation',
    description:
      'Tickets divisés : souscription dès 50€. Démocratise l\'accès aux produits structurés tout en conservant la qualité institutionnelle.',
    accent: '#5535C4',
  },
  {
    icon: TrendingUp,
    title: 'Liquidité secondaire améliorée',
    description:
      'Marché secondaire on-chain permettant le rachat anticipé à des conditions transparentes, avec carnet d\'ordres décentralisé.',
    accent: '#7B5FE0',
  },
];

const PARTNERS: Partner[] = [
  {
    name: 'SG-FORGE',
    subtitle: 'Tokenisation institutionnelle',
    initials: 'SGF',
    gradient: 'linear-gradient(135deg, #E8334A, #D62246)',
  },
  {
    name: 'BNP AssetFoundry',
    subtitle: 'Plateforme de titrisation',
    initials: 'BNP',
    gradient: 'linear-gradient(135deg, #008B6E, #00B894)',
  },
  {
    name: 'Canton Network',
    subtitle: 'Blockchain institutionnelle',
    initials: 'CN',
    gradient: 'linear-gradient(135deg, #3B1FA8, #7B5FE0)',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokenisationPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Tokenisation | Strick'in";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    setSubmitted(true);
    setEmail('');
    window.setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-white dark:from-ink dark:to-ink">
      {/* ─── Top navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-ink/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-ink hover:text-[#3B1FA8] transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="font-display font-extrabold text-[15px]">
              Strick<span className="text-[#5535C4]">&apos;in</span>
            </span>
          </Link>
          <Link
            href="#informer"
            className={cn(
              'hidden sm:inline-flex items-center gap-1.5 h-8 px-4 rounded-xl',
              'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white',
              'font-body font-semibold text-[12px]',
              'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}
          >
            Être informé
            <Bell size={12} />
          </Link>
        </div>
      </header>

      <main id="main-content" role="main">
        {/* ─── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 -z-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#3B1FA8]/10 blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-[#7B5FE0]/10 blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B1FA8]/10 border border-[#3B1FA8]/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B1FA8] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B1FA8]">
                Roadmap 2026 · Early access
              </span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-tight text-ink mb-6">
              Prêt pour la tokenisation
              <br />
              <span className="bg-gradient-to-r from-[#3B1FA8] via-[#5535C4] to-[#7B5FE0] bg-clip-text text-transparent">
                des produits structurés
              </span>
            </h1>
            <p className="text-[15px] md:text-[17px] text-ink-2 dark:text-ink-3 max-w-3xl mx-auto leading-relaxed font-body">
              Strick&apos;in prépare l&apos;avenir de la distribution : règlement instantané on-chain,
              micro-unitarisation et liquidité secondaire augmentée. Découvrez notre feuille de route
              et notre démo live sur Canton Network.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <TokenizationBadge network="canton" />
              <TokenizationBadge network="sg-forge" />
            </div>
          </div>
        </section>

        {/* ─── Video explainer ─────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
          <VideoPlayer />
        </section>

        {/* ─── Roadmap ─────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-ink mb-3">
              Feuille de route tokenisation
            </h2>
            <p className="text-[14px] text-ink-3 font-body">
              De la preuve de concept à l&apos;ouverture complète du catalogue.
            </p>
          </div>
          <ol className="relative border-l-2 border-[#3B1FA8]/20 ml-4 md:ml-12 space-y-8">
            {ROADMAP.map((m) => (
              <RoadmapItem key={m.date} milestone={m} />
            ))}
          </ol>
        </section>

        {/* ─── Advantages ──────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-[#3B1FA8]/3 to-transparent py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-ink mb-3">
                Les avantages de la tokenisation
              </h2>
              <p className="text-[14px] text-ink-3 font-body max-w-2xl mx-auto">
                Une infrastructure financière moderne qui réinvente le règlement et la distribution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ADVANTAGES.map((a) => (
                <AdvantageCard key={a.title} advantage={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Partners ────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-ink mb-3">
              Nos partenaires d&apos;infrastructure
            </h2>
            <p className="text-[14px] text-ink-3 font-body">
              Strick&apos;in s&apos;appuie sur les leaders de la tokenisation institutionnelle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PARTNERS.map((p) => (
              <PartnerCard key={p.name} partner={p} />
            ))}
          </div>
        </section>

        {/* ─── Live demo ───────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-transparent via-[#3B1FA8]/3 to-transparent py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00B894]/10 border border-[#00B894]/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B894] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00B894]">
                  Démo live
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-ink mb-3">
                Souscrivez on-chain en 5 étapes
              </h2>
              <p className="text-[14px] text-ink-3 font-body max-w-2xl mx-auto">
                Testez le flow complet de souscription tokenisée avec un wallet mock.
                Règlement simulé en moins de 5 secondes.
              </p>
            </div>
            <OnChainSettlementFlow />
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────── */}
        <section id="informer" className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div
              className={cn(
                'relative rounded-2xl overflow-hidden',
                'bg-gradient-to-br from-[#3B1FA8] via-[#5535C4] to-[#7B5FE0]',
                'shadow-2xl shadow-violet/20',
                'p-8 md:p-12 text-center text-white',
              )}
            >
              <div className="absolute inset-0 bg-[url('/og-image.svg')] opacity-[0.03] pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm mb-5">
                  <Shield size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Early access · Priorité partenaires
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-2xl md:text-4xl mb-4">
                  Être informé de l&apos;ouverture
                </h2>
                <p className="text-[14px] text-white/80 font-body max-w-xl mx-auto mb-8">
                  Laissez-nous votre email professionnel. Vous recevrez une invitation dès
                  l&apos;ouverture du POC Canton en Q1 2026.
                </p>
                {submitted ? (
                  <div
                    role="status"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30"
                  >
                    <Check size={16} />
                    <span className="font-body text-[13px] font-semibold">
                      Merci ! Votre demande est enregistrée.
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row items-stretch gap-2 max-w-md mx-auto"
                  >
                    <label htmlFor="tokenisation-email" className="sr-only">
                      Email professionnel
                    </label>
                    <input
                      id="tokenisation-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@cabinet.fr"
                      className={cn(
                        'flex-1 h-11 px-4 rounded-xl',
                        'bg-white/90 text-ink placeholder:text-ink-3/60',
                        'text-[13px] font-body',
                        'focus:outline-none focus:ring-4 focus:ring-white/40',
                      )}
                    />
                    <button
                      type="submit"
                      className={cn(
                        'h-11 px-6 rounded-xl font-display font-bold text-[13px]',
                        'bg-white text-[#3B1FA8]',
                        'hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200',
                        'inline-flex items-center justify-center gap-2',
                      )}
                    >
                      Je veux être informé
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function VideoPlayer() {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className={cn(
        'relative aspect-video rounded-2xl overflow-hidden border border-border/50',
        'bg-gradient-to-br from-[#1E1636] via-[#2A1E52] to-[#3B1FA8]',
        'shadow-2xl shadow-violet/10',
      )}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(123,95,224,0.3)_0%,_transparent_70%)]" />
      </div>

      {!playing ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Lancer la vidéo explicative"
          className="absolute inset-0 flex items-center justify-center group cursor-pointer"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl group-hover:bg-white/30 transition-colors" />
            <div
              className={cn(
                'relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center',
                'shadow-2xl shadow-white/20',
                'group-hover:scale-110 transition-transform duration-200',
              )}
            >
              <Play
                size={32}
                className="text-[#3B1FA8] ml-1.5"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 text-left">
            <p className="font-display font-bold text-white text-lg md:text-xl leading-tight">
              La tokenisation expliquée
            </p>
            <p className="text-white/70 text-[12px] md:text-[13px] font-body mt-1">
              90 secondes · Introduction au règlement on-chain
            </p>
          </div>
        </button>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 mb-4 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <p className="font-body text-[13px] text-white/70">
            Vidéo disponible prochainement — POC Q1 2026
          </p>
          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="mt-4 px-4 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-body font-semibold transition-colors"
          >
            Retour
          </button>
        </div>
      )}
    </div>
  );
}

function RoadmapItem({ milestone }: { milestone: RoadmapMilestone }) {
  const isInProgress = milestone.status === 'in-progress';
  const isDone = milestone.status === 'done';
  return (
    <li className="ml-6">
      <span
        className={cn(
          'absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white dark:border-ink',
          isDone
            ? 'bg-[#00B894]'
            : isInProgress
              ? 'bg-gradient-to-br from-[#3B1FA8] to-[#7B5FE0] animate-pulse'
              : 'bg-ink-3/30',
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'rounded-xl border p-5 transition-all duration-200',
          'bg-white/80 dark:bg-white/5 backdrop-blur-sm',
          isInProgress
            ? 'border-[#3B1FA8]/30 shadow-lg shadow-violet/10'
            : 'border-border/40',
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
              isDone
                ? 'bg-[#00B894]/10 text-[#00B894]'
                : isInProgress
                  ? 'bg-[#3B1FA8]/10 text-[#3B1FA8]'
                  : 'bg-ink-3/10 text-ink-3',
            )}
          >
            {milestone.date}
          </span>
          {isInProgress && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B1FA8]">
              En cours
            </span>
          )}
        </div>
        <h3 className="font-display font-bold text-[16px] text-ink mb-1">
          {milestone.title}
        </h3>
        <p className="text-[13px] text-ink-3 font-body leading-relaxed">
          {milestone.description}
        </p>
      </div>
    </li>
  );
}

function AdvantageCard({ advantage }: { advantage: Advantage }) {
  const Icon = advantage.icon;
  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/40 p-6',
        'bg-white/80 dark:bg-white/5 backdrop-blur-sm',
        'transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1 hover:border-[#3B1FA8]/20',
      )}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${advantage.accent}, ${advantage.accent}cc)`,
        }}
      >
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="font-display font-bold text-[16px] text-ink mb-2">
        {advantage.title}
      </h3>
      <p className="text-[13px] text-ink-3 font-body leading-relaxed">
        {advantage.description}
      </p>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-5 rounded-xl border border-border/40',
        'bg-white/80 dark:bg-white/5 backdrop-blur-sm',
        'hover:shadow-md transition-shadow duration-200',
      )}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md"
        style={{ background: partner.gradient }}
      >
        <span className="font-display font-extrabold text-white text-[13px] tracking-tight">
          {partner.initials}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-[14px] text-ink truncate">
          {partner.name}
        </p>
        <p className="text-[11px] text-ink-3 font-body truncate">
          {partner.subtitle}
        </p>
      </div>
    </div>
  );
}
