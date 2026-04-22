'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, Zap, Shield, Brain } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';

// Note: this file is a 'use client' component to keep consistency with the
// rest of the landing codebase and because `ComparisonTable` uses client-only
// APIs (IntersectionObserver, prefers-reduced-motion). `metadata` objects
// cannot live in client components directly — SEO metadata is therefore
// handled at runtime via <head> tags below.

const REASONS: Array<{
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}> = [
  {
    icon: Brain,
    title: 'IA native : scoring, commentary, stress-tests',
    description:
      "Là où Feefty reste un catalogue statique, Strick'in embarque une suite IA qui commente chaque produit, scoore la santé des portefeuilles et simule des scénarios macro en un clic.",
  },
  {
    icon: Zap,
    title: 'Onboarding ORIAS + KYC en 10 minutes',
    description:
      "Vérification ORIAS, AMF et LCB-FT automatisée dès l'inscription. Feefty impose encore un processus manuel de 48 à 72 heures.",
  },
  {
    icon: Shield,
    title: 'Conformité clé en main (DER, KID PRIIPs, SFDR)',
    description:
      "Documents réglementaires générés automatiquement et mis à jour à chaque souscription. Archivage 10 ans conforme MIF II.",
  },
  {
    icon: Sparkles,
    title: 'Multi-pays & tokenisation-ready',
    description:
      "Passeport UE (LU, BE) + Suisse dès aujourd'hui, architecture DLT Pilot Regime demain. Feefty reste concentré sur la France.",
  },
  {
    icon: CheckCircle2,
    title: 'Overbooking FIFO + SMA marketplace',
    description:
      "Pipeline d'engagement avec overbooking 20-30 %, pooling inter-CGP sur la SMA : vous ne manquez plus une tranche, Feefty n'offre aucune de ces capacités.",
  },
];

export default function VsFeeftyPage() {
  return (
    <>
      <head>
        <title>
          Strick&apos;in vs Feefty : quelle plateforme choisir en 2026 ?
        </title>
        <meta
          name="description"
          content="Comparatif complet Strick'in vs Feefty pour distribuer des produits structurés en 2026. Catalogue, IA, conformité, onboarding, émetteurs — tout est passé au crible."
        />
        <meta
          property="og:title"
          content="Strick'in vs Feefty : quelle plateforme choisir en 2026 ?"
        />
        <meta
          property="og:description"
          content="Comparatif complet Strick'in vs Feefty pour distribuer des produits structurés : IA, conformité, onboarding, émetteurs."
        />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="/vs-feefty" />
      </head>

      <main
        className="min-h-screen bg-surface text-ink dark:bg-ink dark:text-white"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-[1080px] mx-auto px-6 md:px-10 py-16 md:py-24">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet hover:underline mb-5"
            >
              ← Retour à l&apos;accueil
            </Link>
            <span className="inline-block text-[11px] uppercase tracking-[0.18em] text-violet font-bold border border-violet/30 rounded-full px-3 py-1 mb-5 bg-violet-pale/40">
              Comparatif plateformes structurés
            </span>
            <h1 className="font-display text-[32px] md:text-[48px] leading-[1.05] font-extrabold tracking-tight mb-6">
              Strick&apos;in vs Feefty : quelle plateforme choisir pour
              distribuer des produits structurés en 2026 ?
            </h1>
            <div className="space-y-4 text-[15px] md:text-[16px] text-ink-2 dark:text-white/75 max-w-3xl leading-relaxed">
              <p>
                Le marché français des produits structurés a doublé depuis 2021
                et dépasse désormais 50 Md€ de collecte annuelle. Les CGP et
                CIF cherchent une plateforme qui combine catalogue
                multi-émetteurs, conformité réglementaire et outils d&apos;aide
                à la décision — là où les solutions historiques montrent leurs
                limites.
              </p>
              <p>
                Feefty, acteur français installé, a bâti une offre orientée
                catalogue et workflow e-signature. Strick&apos;in propose une
                approche nouvelle génération : IA native, marketplace
                secondaire, onboarding automatisé et passeport européen
                complet.
              </p>
              <p>
                Ce comparatif passe en revue{' '}
                <strong>plus de 25 fonctionnalités</strong> critiques pour
                distribuer des structurés en 2026 — de la profondeur émetteurs
                à l&apos;Academy CGP, en passant par la signature électronique
                et la détection ESG.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/demo"
                className={cn(
                  'inline-flex items-center gap-2 h-11 px-5 rounded-md',
                  'bg-violet text-white font-semibold text-[14px]',
                  'shadow-violet hover:bg-violet-dark transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                )}
              >
                Démarrer gratuitement
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/vs-luma"
                className={cn(
                  'inline-flex items-center gap-2 h-11 px-5 rounded-md',
                  'border border-violet/30 text-violet font-semibold text-[14px]',
                  'hover:bg-violet-pale transition-colors',
                )}
              >
                Voir aussi : Strick&apos;in vs Luma
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1180px] mx-auto px-6 md:px-10">
            <ComparisonTable
              title="Feature par feature"
              subtitle="Le détail fonctionnel, aucune fioriture. Validez vous-même si votre pile de distribution actuelle est prête pour 2026."
            />
          </div>
        </section>

        {/* Reasons */}
        <section className="border-t border-border bg-surface-2/30 dark:bg-white/[0.02] py-16 md:py-24">
          <div className="max-w-[1080px] mx-auto px-6 md:px-10">
            <header className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[11px] uppercase tracking-[0.18em] text-violet font-bold">
                Synthèse
              </span>
              <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-ink dark:text-white leading-tight mt-3">
                Les 5 raisons de choisir Strick&apos;in plutôt que Feefty
              </h2>
            </header>
            <ol className="grid gap-4 md:grid-cols-2">
              {REASONS.map((r, i) => (
                <li
                  key={r.title}
                  className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-5 flex gap-4"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
                    }}
                  >
                    <r.icon size={18} className="text-white" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-violet font-bold mb-1">
                      Raison {i + 1}
                    </p>
                    <h3 className="font-display font-bold text-[15px] text-ink dark:text-white leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-[13px] text-ink-2 dark:text-white/70 mt-1.5 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="max-w-[720px] mx-auto px-6 md:px-10 text-center">
            <h2 className="font-display text-[24px] md:text-[32px] font-extrabold text-ink dark:text-white leading-tight mb-4">
              Prêt à distribuer des structurés sans frottement ?
            </h2>
            <p className="text-[14px] md:text-[15px] text-ink-2 dark:text-white/70 mb-7">
              Démarrez en moins de 10 minutes. Aucune carte bancaire requise,
              accompagnement humain en option.
            </p>
            <Link
              href="/demo"
              className={cn(
                'inline-flex items-center gap-2 h-12 px-6 rounded-md',
                'bg-violet text-white font-semibold text-[15px]',
                'shadow-violet hover:bg-violet-dark transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
              )}
            >
              Démarrer gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Footer links */}
        <footer className="border-t border-border py-8">
          <div className="max-w-[1080px] mx-auto px-6 md:px-10 flex flex-wrap gap-x-6 gap-y-3 text-[12px] text-ink-3">
            <Link href="/" className="hover:text-violet">
              Accueil
            </Link>
            <Link href="/vs-luma" className="hover:text-violet">
              Strick&apos;in vs Luma
            </Link>
            <Link href="/demo" className="hover:text-violet">
              Demander une démo
            </Link>
            <Link href="/mentions-legales" className="hover:text-violet">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-violet">
              Confidentialité
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
