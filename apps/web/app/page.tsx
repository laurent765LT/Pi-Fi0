'use client';

import Link from 'next/link';
import { Calculator, Sparkles, Building2, ArrowRight, ChevronDown, Zap } from 'lucide-react';

const metrics = [
  { value: '17', label: 'Produits actifs' },
  { value: '5', label: 'Émetteurs' },
  { value: '€2.1Mrd', label: 'Sous gestion' },
];

const features = [
  {
    icon: Calculator,
    title: 'Pricing Engine',
    description:
      'Simulez vos produits en temps réel avec des données de marché live. Obtenez des cotations instantanées sur autocalls, phoenix, reverse convertibles et plus.',
    gradient: 'from-violet to-violet-mid',
  },
  {
    icon: Sparkles,
    title: 'IA Intégrée',
    description:
      'Recommandations personnalisées, analyse de portefeuille et génération de documents KID automatisée grâce à notre moteur d\'intelligence artificielle.',
    gradient: 'from-cobalt to-cobalt-light',
  },
  {
    icon: Building2,
    title: 'Multi-émetteurs',
    description:
      'Envoyez des RFQ simultanées à 5+ émetteurs et comparez les offres en direct. BNP, Goldman Sachs, SocGen, Natixis et Barclays connectés.',
    gradient: 'from-violet-mid to-cobalt-mid',
  },
];

const issuers = ['BNP Paribas', 'Goldman Sachs', 'Société Générale', 'Natixis', 'Barclays'];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface font-body">
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-violet min-h-screen flex flex-col items-center justify-center px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-cobalt-light/10 blur-3xl" />
          <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-violet-light/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02] blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-8 animate-pulse-subtle">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-semibold tracking-wide text-white/90 uppercase">
              Plateforme #1 en France
            </span>
            <Sparkles className="w-3.5 h-3.5 text-gold" />
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white leading-[1.05] mb-6">
            La marketplace des
            <br />
            <span className="bg-gradient-to-r from-white via-violet-pale to-cobalt-pale bg-clip-text text-transparent">
              produits structurés
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/70 font-body leading-relaxed mb-10">
            Strick&apos;in connecte les CGP et assureurs aux meilleurs émetteurs
            de produits structurés. Pricing en temps réel, comparaison
            multi-émetteurs et souscription digitalisée.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-violet font-display font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
            >
              Accéder à la plateforme
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/25 text-white font-display font-bold text-sm tracking-wide hover:bg-white/10 transition-all duration-200"
            >
              Découvrir
              <ChevronDown className="w-4 h-4 animate-float" />
            </button>
          </div>

          {/* Floating metrics */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className="relative flex flex-col items-center px-6 py-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'both' }}
              >
                <span className="font-display text-2xl md:text-3xl font-extrabold text-white">
                  {m.value}
                </span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/50 font-semibold mt-1">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 rounded-full bg-white/40 animate-pulse-subtle" />
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-container mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="label-section">Fonctionnalités</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink mt-4 mb-4">
              Tout ce qu&apos;il faut pour{' '}
              <span className="text-gradient">distribuer mieux</span>
            </h2>
            <p className="max-w-xl mx-auto text-ink-3 leading-relaxed">
              Une plateforme pensée pour les professionnels de la gestion de patrimoine
              et de l&apos;assurance-vie.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover border border-border/50 hover:border-violet-pale transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-violet/20 shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <f.icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>

                <h3 className="font-display text-lg font-bold text-ink mb-2">{f.title}</h3>
                <p className="text-sm text-ink-3 leading-relaxed">{f.description}</p>

                {/* Hover gradient line at bottom */}
                <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-violet via-cobalt-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ──────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-border/60 bg-white">
        <div className="max-w-container mx-auto px-6">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-ink-4 font-semibold mb-6">
            Émetteurs connectés
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {issuers.map((name) => (
              <span
                key={name}
                className="font-display text-lg md:text-xl font-bold text-ink-3/40 hover:text-violet transition-colors duration-200 cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Footer ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-20 md:py-28 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Prêt à transformer
            <br />
            votre distribution ?
          </h2>
          <p className="text-white/50 mb-10 leading-relaxed">
            Rejoignez les CGP et compagnies qui utilisent déjà Strick&apos;in pour
            sourcer, pricer et souscrire leurs produits structurés.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-violet font-display font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─── Footer Bar ───────────────────────────────────────────────────── */}
      <footer className="bg-ink border-t border-white/5 py-6 px-6">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold text-white/60">Strick&apos;in</span>
          <span className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Strick&apos;in. Tous droits réservés.
          </span>
        </div>
      </footer>
    </div>
  );
}
