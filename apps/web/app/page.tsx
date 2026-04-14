'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Calculator, Sparkles, Building2, ArrowRight, ChevronDown, Zap, Shield, BarChart3, Globe } from 'lucide-react';

// ─── Animated counter hook (inline for landing — no auth-gated imports) ──────
function useCounter(target: number, duration = 1800, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

// ─── Scroll reveal hook ─────────────────────────────────────────────────────
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const metrics = [
  { value: 17, suffix: '', label: 'Produits actifs' },
  { value: 5, suffix: '', label: 'Émetteurs' },
  { value: 2.1, suffix: 'Mrd €', label: 'Sous gestion', decimal: true },
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

const stats = [
  { icon: Shield, value: 99.9, suffix: '%', label: 'Uptime garanti', decimal: true },
  { icon: BarChart3, value: 150, suffix: '+', label: 'Produits pricés/mois' },
  { icon: Globe, value: 12, suffix: '', label: 'Pays couverts' },
  { icon: Zap, value: 3, suffix: 's', label: 'Temps moyen de pricing' },
];

const issuers = ['BNP Paribas', 'Goldman Sachs', 'Société Générale', 'Natixis', 'Barclays'];

export default function Home() {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setHeroVisible(true); }, []);

  const m0 = useCounter(metrics[0].value, 1800, heroVisible);
  const m1 = useCounter(metrics[1].value, 1800, heroVisible);
  const m2 = useCounter(Math.round(metrics[2].value * 10), 1800, heroVisible);
  const metricValues = [String(m0), String(m1), `${(m2 / 10).toFixed(1).replace('.', ',')} Mrd €`];

  return (
    <div className="min-h-screen bg-surface font-body">
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-violet min-h-screen flex flex-col items-center justify-center px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-cobalt-light/10 blur-3xl animate-[breathe_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-violet-light/10 blur-3xl animate-[breathe_10s_ease-in-out_infinite_2s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02] blur-2xl" />
          {/* Floating particles */}
          <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-white/20 animate-float" />
          <div className="absolute top-[60%] right-[20%] w-2 h-2 rounded-full bg-white/10 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[35%] right-[10%] w-1 h-1 rounded-full bg-white/15 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
              className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-violet font-display font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 overflow-hidden"
            >
              {/* CTA shimmer effect */}
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-violet/10 to-transparent" />
              <span className="relative">Accéder à la plateforme</span>
              <ArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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

          {/* Floating metrics — animated counters */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className={`relative flex flex-col items-center px-6 py-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${600 + i * 150}ms` }}
              >
                <span className="font-display text-2xl md:text-3xl font-extrabold text-white tabular-nums">
                  {metricValues[i]}
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
      <FeaturesSection />

      {/* ─── Stats Band ───────────────────────────────────────────────────── */}
      <StatsSection />

      {/* ─── Social Proof ──────────────────────────────────────────────────── */}
      <IssuersSection />

      {/* ─── CTA Footer ───────────────────────────────────────────────────── */}
      <CtaSection />

      {/* ─── Footer Bar ────────────────────────────────────────────────────── */}
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

// ─── Features Section (scroll reveal) ──────────────────────────────────────

function FeaturesSection() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  return (
    <section id="features" className="py-24 md:py-32 px-6" ref={ref}>
      <div className="max-w-container mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover border border-border/50 hover:border-violet-pale transition-all duration-500 hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-violet/20 shadow-md group-hover:scale-110 transition-transform duration-300`}
              >
                <f.icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-ink-3 leading-relaxed">{f.description}</p>
              <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-violet via-cobalt-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Section (animated counters on scroll) ───────────────────────────

function StatsSection() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  const s0 = useCounter(Math.round(stats[0].value * 10), 1500, visible);
  const s1 = useCounter(stats[1].value, 1500, visible);
  const s2 = useCounter(stats[2].value, 1500, visible);
  const s3 = useCounter(stats[3].value, 1500, visible);
  const statValues = [
    `${(s0 / 10).toFixed(1).replace('.', ',')}${stats[0].suffix}`,
    `${s1}${stats[1].suffix}`,
    `${s2}`,
    `${s3}${stats[3].suffix}`,
  ];

  return (
    <section ref={ref} className="py-16 bg-gradient-to-r from-violet/[0.03] via-cobalt/[0.02] to-violet/[0.03]">
      <div className="max-w-container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-violet/[0.08] flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5 text-violet" strokeWidth={2} />
              </div>
              <span className="font-display text-3xl md:text-4xl font-extrabold text-ink tabular-nums">
                {statValues[i]}
              </span>
              <span className="text-xs text-ink-3 font-medium mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Issuers Section ───────────────────────────────────────────────────────

function IssuersSection() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className="py-12 border-y border-border/60 bg-white">
      <div className="max-w-container mx-auto px-6">
        <p className={`text-center text-[10px] uppercase tracking-[0.3em] text-ink-4 font-semibold mb-6 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          Émetteurs connectés
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {issuers.map((name, i) => (
            <span
              key={name}
              className={`font-display text-lg md:text-xl font-bold text-ink-3/40 hover:text-violet transition-all duration-500 cursor-default ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ───────────────────────────────────────────────────────────

function CtaSection() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative overflow-hidden bg-ink py-20 md:py-28 px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet/20 blur-[120px] rounded-full" />
      </div>
      <div className={`relative z-10 max-w-2xl mx-auto text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
          className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-violet font-display font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 overflow-hidden"
        >
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-violet/10 to-transparent" />
          <span className="relative">Commencer maintenant</span>
          <ArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
