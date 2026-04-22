'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';

// ─── Issuer data ─────────────────────────────────────────────────────────────
const ISSUERS = [
  { id: 'etoile', name: 'Banque Étoile', short: 'ÉTO', color: '#2B3A67' },
  { id: 'lumiere', name: 'Crédit Lumière', short: 'LUM', color: '#7A1E3C' },
  { id: 'mistral', name: 'Mistral Finance', short: 'MST', color: '#1F5F4F' },
  { id: 'septembre', name: 'Septembre Capital', short: 'SPT', color: '#4A2B7A' },
  { id: 'arcane', name: 'Arcane Marchés', short: 'ARC', color: '#8B5A1A' },
];

function IssuerBadge({ id, size = 24 }: { id: string; size?: number }) {
  const iss = ISSUERS.find((i) => i.id === id) ?? ISSUERS[0];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 4,
        background: iss.color,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: Math.max(8, Math.round(size * 0.36)),
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {iss.short}
    </span>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 64,
        background: scrolled ? 'rgba(252,252,251,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(12px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--redesign-border)'
          : '1px solid transparent',
        transition: 'all 200ms ease-out',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 32px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--redesign-text-primary)',
            textDecoration: 'none',
          }}
        >
          <span
            className="font-display-new"
            style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em' }}
          >
            Strick&apos;in
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 28, marginLeft: 8, flex: 1 }}>
          {['Produit', 'Émetteurs', 'Tarifs', 'À propos'].map((l) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                fontSize: 13,
                color: 'var(--redesign-text-secondary)',
                textDecoration: 'none',
              }}
            >
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/login" className="btn-new btn-ghost-new btn-sm-new">
            Se connecter
          </Link>
          <Link href="/login" className="btn-new btn-primary-new btn-sm-new">
            Demander un accès
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      style={{
        background: 'var(--redesign-white)',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '120px 32px 140px',
          position: 'relative',
        }}
      >
        <div className="animate-fade-up" style={{ maxWidth: 820 }}>
          <div className="tag-eyebrow" style={{ marginBottom: 32 }}>
            Marketplace B2B · Produits structurés
          </div>
          <h1
            className="font-display-new"
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.0,
              margin: '0 0 32px',
              letterSpacing: '-0.04em',
              color: 'var(--redesign-text-primary)',
            }}
          >
            Distribuer
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500 }}>
              autrement.
            </span>
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: 'var(--redesign-text-secondary)',
              maxWidth: 560,
              margin: '0 0 40px',
            }}
          >
            Une plateforme sobre pour connecter CGP, assureurs et émetteurs.
            Pricing, RFQ et conformité — au même endroit.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-new btn-primary-new btn-lg-new">
              Demander un accès
            </Link>
            <Link href="/demo" className="btn-new btn-ghost-new btn-lg-new">
              Voir la démo →
            </Link>
          </div>
        </div>

        {/* Metric strip */}
        <div
          style={{
            marginTop: 120,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 48,
            paddingTop: 40,
            borderTop: '1px solid var(--redesign-border)',
          }}
        >
          {[
            { v: '17', l: 'Produits actifs' },
            { v: '5', l: 'Émetteurs' },
            { v: '2,1 Mrd €', l: 'Sous gestion' },
            { v: '< 30 s', l: 'Par pricing' },
          ].map((s, i) => (
            <div key={i}>
              <div
                className="font-mono-new tabular"
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: 'var(--redesign-text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--redesign-text-tertiary)',
                  marginTop: 6,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Ticker ──────────────────────────────────────────────────────────────────
function LandingTicker() {
  const items = [
    { n: 'Autocall Phoenix Mémoire', iss: 'ÉTO', cp: '7,25 %', tr: '2,4 M€' },
    { n: 'Athéna Trimestriel', iss: 'LUM', cp: '6,50 %', tr: '1,8 M€' },
    { n: 'Capital Protégé Europe', iss: 'MST', cp: '4,10 %', tr: '3,1 M€' },
    { n: 'Reverse Tech', iss: 'SPT', cp: '9,80 %', tr: '840 k€' },
    { n: 'Phoenix Dividende', iss: 'ARC', cp: '6,90 %', tr: '2,2 M€' },
    { n: 'Autocall Prestige', iss: 'LUM', cp: '7,80 %', tr: '1,5 M€' },
    { n: 'Capital Garanti Monde', iss: 'MST', cp: '3,95 %', tr: '4,4 M€' },
    { n: 'Bonus Énergie', iss: 'ÉTO', cp: '5,75 %', tr: '920 k€' },
  ];
  const doubled = [...items, ...items];
  return (
    <section
      style={{
        background: 'var(--redesign-white)',
        borderBottom: '1px solid var(--redesign-border)',
        padding: '24px 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto 20px',
          padding: '0 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div className="tag-eyebrow" style={{ margin: 0 }}>
          Aujourd&apos;hui sur la plateforme · flux indicatif
        </div>
        <div
          className="font-mono-new"
          style={{
            fontSize: 11,
            color: 'var(--redesign-text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: 'var(--redesign-success)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          LIVE
        </div>
      </div>
      <div
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          overflow: 'hidden',
        }}
      >
        <div className="ticker-track" style={{ animationDuration: '60s' }}>
          {doubled.map((it, i) => (
            <div
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 16px',
                border: '1px solid var(--redesign-border)',
                borderRadius: 999,
                background: 'var(--redesign-off-white)',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--redesign-text-tertiary)',
                  letterSpacing: '0.05em',
                }}
              >
                {it.iss}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {it.n}
              </span>
              <span
                className="font-mono-new tabular"
                style={{
                  fontSize: 12,
                  color: 'var(--redesign-accent)',
                  fontWeight: 500,
                }}
              >
                {it.cp}
              </span>
              <span
                className="font-mono-new tabular"
                style={{
                  fontSize: 11,
                  color: 'var(--redesign-text-tertiary)',
                }}
              >
                {it.tr}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const feats = [
    {
      num: '01',
      title: 'Pricing Engine',
      body: 'Un prix indicatif en moins de trente secondes. Sur autocall, reverse, capital protégé et phoenix mémoire.',
    },
    {
      num: '02',
      title: 'RFQ multi-émetteurs',
      body: 'Une demande, cinq émetteurs, cinq offres comparables en temps réel. Sans échanges par email.',
    },
    {
      num: '03',
      title: 'Intelligence intégrée',
      body: "L'agent IA analyse vos portefeuilles, suggère des produits et anticipe les observations.",
    },
  ];
  return (
    <section
      style={{
        background: 'var(--redesign-off-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 80, maxWidth: 640 }}>
          <div className="tag-eyebrow" style={{ marginBottom: 24 }}>
            Produit
          </div>
          <h2
            className="font-display-new"
            style={{
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--redesign-text-primary)',
            }}
          >
            Trois outils essentiels. Rien de plus.
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            borderTop: '1px solid var(--redesign-border)',
          }}
        >
          {feats.map((f, i) => (
            <div
              key={i}
              style={{
                padding: '40px 32px 40px 0',
                borderRight:
                  i < 2 ? '1px solid var(--redesign-border)' : 'none',
                paddingLeft: i > 0 ? 32 : 0,
              }}
            >
              <div
                className="font-mono-new"
                style={{
                  fontSize: 11,
                  color: 'var(--redesign-text-tertiary)',
                  marginBottom: 20,
                  letterSpacing: '0.04em',
                }}
              >
                {f.num}
              </div>
              <h3
                className="font-display-new"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  margin: '0 0 12px',
                  letterSpacing: '-0.015em',
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'var(--redesign-text-secondary)',
                  margin: 0,
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparator Demo ─────────────────────────────────────────────────────────
function ComparatorDemo() {
  const [type, setType] = useState('Autocall');
  const [underlying, setUnderlying] = useState('CAC 40');
  const [barrier, setBarrier] = useState(70);
  const [maturity, setMaturity] = useState(5);

  const price = useMemo(() => {
    const base =
      ({ Autocall: 7.2, 'Capital Protégé': 3.9, Reverse: 9.1, Phoenix: 6.8 } as Record<
        string,
        number
      >)[type] ?? 6;
    const mat = maturity * 0.12;
    const bar = (100 - barrier) * 0.05;
    return (base + mat - bar).toFixed(2);
  }, [type, barrier, maturity]);

  const offers = [
    { iss: 'etoile', name: 'Banque Étoile', delta: 0 },
    { iss: 'lumiere', name: 'Crédit Lumière', delta: -0.18 },
    { iss: 'mistral', name: 'Mistral Finance', delta: 0.12 },
    { iss: 'septembre', name: 'Septembre Capital', delta: -0.35 },
    { iss: 'arcane', name: 'Arcane Marchés', delta: 0.22 },
  ];

  const bestIdx = offers.reduce(
    (best, cur, idx) =>
      parseFloat(price) + cur.delta >
      parseFloat(price) + offers[best].delta
        ? idx
        : best,
    0,
  );

  return (
    <section
      style={{
        background: 'var(--redesign-off-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="tag-eyebrow" style={{ marginBottom: 24 }}>
            Démonstration
          </div>
          <h2
            className="font-display-new"
            style={{
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--redesign-text-primary)',
            }}
          >
            Essayez le moteur en direct.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: 'var(--redesign-text-secondary)',
              margin: '16px 0 0',
              maxWidth: 520,
            }}
          >
            Modifiez les paramètres. Cinq offres émetteurs, comparables, en
            moins de trente secondes.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: 0,
            border: '1px solid var(--redesign-border)',
            background: 'var(--redesign-white)',
          }}
        >
          {/* Parameters */}
          <div
            style={{
              padding: 32,
              borderRight: '1px solid var(--redesign-border)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--redesign-text-tertiary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              Paramètres
            </div>

            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--redesign-text-secondary)',
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                Type de produit
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                }}
              >
                {['Autocall', 'Capital Protégé', 'Reverse', 'Phoenix'].map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      style={{
                        border: `1px solid ${
                          type === t
                            ? 'var(--redesign-text-primary)'
                            : 'var(--redesign-border)'
                        }`,
                        background:
                          type === t
                            ? 'var(--redesign-text-primary)'
                            : 'var(--redesign-white)',
                        color:
                          type === t
                            ? 'white'
                            : 'var(--redesign-text-primary)',
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        borderRadius: 4,
                      }}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--redesign-text-secondary)',
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                Sous-jacent
              </label>
              <select
                value={underlying}
                onChange={(e) => setUnderlying(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--redesign-border)',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  background: 'var(--redesign-white)',
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {[
                  'CAC 40',
                  'Euro Stoxx 50',
                  'S&P 500',
                  'Nasdaq 100',
                  'MSCI World',
                ].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--redesign-text-secondary)',
                  }}
                >
                  Barrière
                </label>
                <span
                  className="font-mono-new tabular"
                  style={{
                    fontSize: 12,
                    color: 'var(--redesign-text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {barrier} %
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={barrier}
                onChange={(e) => setBarrier(+e.target.value)}
                style={{
                  width: '100%',
                  accentColor: 'var(--redesign-accent)',
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--redesign-text-secondary)',
                  }}
                >
                  Maturité
                </label>
                <span
                  className="font-mono-new tabular"
                  style={{
                    fontSize: 12,
                    color: 'var(--redesign-text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {maturity} ans
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={maturity}
                onChange={(e) => setMaturity(+e.target.value)}
                style={{
                  width: '100%',
                  accentColor: 'var(--redesign-accent)',
                }}
              />
            </div>
          </div>

          {/* Results */}
          <div
            style={{
              padding: 32,
              background: 'var(--redesign-off-white)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--redesign-text-tertiary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Cinq offres comparables
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--redesign-success)',
                  fontFamily: 'JetBrains Mono, monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--redesign-success)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                Actualisé il y a 2 s
              </div>
            </div>

            {offers.map((o, i) => {
              const cp = (parseFloat(price) + o.delta).toFixed(2);
              const isBest = i === bestIdx;
              return (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    alignItems: 'center',
                    gap: 24,
                    padding: '16px 0',
                    borderBottom:
                      i < offers.length - 1
                        ? '1px solid var(--redesign-border)'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <IssuerBadge id={o.iss} size={28} />
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--redesign-text-primary)',
                        }}
                      >
                        {o.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--redesign-text-tertiary)',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        Coupon conditionnel · Observation trimestrielle
                      </div>
                    </div>
                  </div>
                  <div
                    className="font-mono-new tabular"
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: isBest
                        ? 'var(--redesign-accent)'
                        : 'var(--redesign-text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {cp} %
                  </div>
                  {isBest ? (
                    <span
                      className="pill-new"
                      style={{
                        background: 'var(--redesign-accent-light)',
                        color: 'var(--redesign-accent)',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        letterSpacing: '0.06em',
                      }}
                    >
                      MEILLEURE
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--redesign-text-tertiary)',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {o.delta > 0 ? '+' : ''}
                      {o.delta.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Roles ───────────────────────────────────────────────────────────────────
type RoleKey = 'cgp' | 'family' | 'assurance';
function RolesSection() {
  const [active, setActive] = useState<RoleKey>('cgp');
  const roles: Record<
    RoleKey,
    {
      label: string;
      title: string;
      body: string;
      stats: { k: string; v: string }[];
      bullets: string[];
    }
  > = {
    cgp: {
      label: 'Conseiller en gestion de patrimoine',
      title: 'Pour les CGP',
      body: 'Un catalogue curé, un pricing instantané et des commissions consolidées. Allez du rendez-vous client à la souscription en quelques clics.',
      stats: [
        { k: 'Temps de sélection', v: '—68 %' },
        { k: "Taux d'adoption", v: '92 %' },
        { k: 'Utilisateurs actifs', v: '1 240' },
      ],
      bullets: [
        'Catalogue multi-émetteurs',
        'Simulations illustrées client',
        'Commissions consolidées',
        'Conformité MIF2 automatique',
      ],
    },
    family: {
      label: 'Family Office',
      title: 'Pour les Family Offices',
      body: "Construisez des produits sur-mesure, comparez cinq offres simultanément et bénéficiez d'un research macro intégré. Vos mandats, à l'échelle.",
      stats: [
        { k: 'RFQ traités', v: '3 800/mois' },
        { k: 'Gain de marge', v: '+47 pb' },
        { k: 'Émetteurs comparés', v: '5' },
      ],
      bullets: [
        'RFQ multi-émetteurs',
        'Produits sur-mesure',
        'Research intégré Bloomberg',
        'Portefeuilles consolidés',
      ],
    },
    assurance: {
      label: 'Assureur & Réseaux',
      title: 'Pour les assureurs',
      body: "Intégrez le catalogue à votre contrat UC, supervisez la distribution de vos conseillers et reportez en un clic auprès de l'ACPR.",
      stats: [
        { k: 'UC référencées', v: '340' },
        { k: 'Conseillers', v: '6 200' },
        { k: 'Reporting ACPR', v: 'Natif' },
      ],
      bullets: [
        'Référencement UC structurées',
        'Supervision multi-cabinets',
        'Reporting ACPR natif',
        'Auditabilité complète',
      ],
    },
  };
  const r = roles[active];

  return (
    <section
      style={{
        background: 'var(--redesign-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="tag-eyebrow" style={{ marginBottom: 24 }}>
            Pour qui
          </div>
          <h2
            className="font-display-new"
            style={{
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--redesign-text-primary)',
            }}
          >
            Un outil, trois métiers.
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 48,
            borderBottom: '1px solid var(--redesign-border)',
            flexWrap: 'wrap',
          }}
        >
          {(Object.entries(roles) as [RoleKey, (typeof roles)[RoleKey]][]).map(
            ([key, role]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '16px 24px 16px 0',
                  marginRight: 24,
                  fontSize: 14,
                  fontWeight: active === key ? 600 : 500,
                  color:
                    active === key
                      ? 'var(--redesign-text-primary)'
                      : 'var(--redesign-text-tertiary)',
                  borderBottom:
                    active === key
                      ? '1.5px solid var(--redesign-text-primary)'
                      : '1.5px solid transparent',
                  marginBottom: -1,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {role.label}
              </button>
            ),
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 80,
          }}
        >
          <div>
            <h3
              className="font-display-new"
              style={{
                fontSize: 40,
                fontWeight: 700,
                margin: '0 0 24px',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: 'var(--redesign-text-primary)',
              }}
            >
              {r.title}
            </h3>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: 'var(--redesign-text-secondary)',
                margin: '0 0 32px',
              }}
            >
              {r.body}
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {r.bullets.map((b) => (
                <li
                  key={b}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    color: 'var(--redesign-text-primary)',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 1,
                      background: 'var(--redesign-accent)',
                    }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 0,
              borderLeft: '1px solid var(--redesign-border)',
              paddingLeft: 48,
            }}
          >
            {r.stats.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '28px 0',
                  borderBottom:
                    i < r.stats.length - 1
                      ? '1px solid var(--redesign-border)'
                      : 'none',
                }}
              >
                <div
                  className="font-display-new"
                  style={{
                    fontSize: 44,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: 'var(--redesign-text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--redesign-text-tertiary)',
                    marginTop: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Issuers ─────────────────────────────────────────────────────────────────
function IssuersSection() {
  return (
    <section
      style={{
        background: 'var(--redesign-white)',
        padding: '100px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div
          className="tag-eyebrow"
          style={{
            marginBottom: 48,
            justifyContent: 'center',
            display: 'flex',
          }}
        >
          Émetteurs partenaires
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          {ISSUERS.map((iss) => (
            <div
              key={iss.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: 0.55,
              }}
            >
              <IssuerBadge id={iss.id} size={22} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {iss.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why Strick'in (comparison table) ────────────────────────────────────────
function WhyStrickinSection() {
  return (
    <section
      id="pourquoi-strickin"
      style={{
        background: 'var(--redesign-white)',
        padding: '120px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <div
            className="tag-eyebrow"
            style={{ marginBottom: 24, justifyContent: 'center', display: 'inline-flex' }}
          >
            Pourquoi Strick&apos;in ?
          </div>
          <h2
            className="font-display-new"
            style={{
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--redesign-text-primary)',
            }}
          >
            La seule plateforme française pensée pour 2026
          </h2>
          <p
            style={{
              fontSize: 16,
              marginTop: 20,
              color: 'var(--redesign-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Comparatif transparent des 25 fonctionnalités critiques. Strick&apos;in
            face à Feefty et Luma — à vous de juger.
          </p>
        </div>
        <ComparisonTable />
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link
            href="/vs-feefty"
            style={{
              color: 'var(--redesign-accent)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              marginRight: 24,
            }}
          >
            Analyse détaillée vs Feefty →
          </Link>
          <Link
            href="/vs-luma"
            style={{
              color: 'var(--redesign-accent)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Analyse détaillée vs Luma →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Process ─────────────────────────────────────────────────────────────────
function ProcessSection() {
  const steps = [
    {
      n: '01',
      t: 'Onboarding en 10 minutes',
      b: "Vérification ORIAS et AMF automatisée dès l'inscription.",
    },
    {
      n: '02',
      t: 'Comparez en temps réel',
      b: 'Un RFQ envoyé à cinq émetteurs simultanément.',
    },
    {
      n: '03',
      t: 'Distribuez, suivez',
      b: 'Souscription et commissions consolidées dans un tableau de bord unifié.',
    },
  ];
  return (
    <section
      style={{
        background: 'var(--redesign-off-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 80, maxWidth: 640 }}>
          <div className="tag-eyebrow" style={{ marginBottom: 24 }}>
            Processus
          </div>
          <h2
            className="font-display-new"
            style={{
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--redesign-text-primary)',
            }}
          >
            De l&apos;inscription au premier pricing, moins d&apos;une heure.
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 64,
          }}
        >
          {steps.map((s, i) => (
            <div key={i}>
              <div
                className="font-mono-new"
                style={{
                  fontSize: 11,
                  color: 'var(--redesign-text-tertiary)',
                  marginBottom: 20,
                }}
              >
                {s.n}
              </div>
              <h3
                className="font-display-new"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  margin: '0 0 12px',
                  letterSpacing: '-0.015em',
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {s.t}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'var(--redesign-text-secondary)',
                  margin: 0,
                }}
              >
                {s.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const tes = [
    {
      q: "Strick'in a réduit notre temps de sélection de produits de trois jours à trente minutes.",
      name: 'Hélène Marchetti',
      role: 'Ingénierie patrimoniale, Cabinet Véga',
    },
    {
      q: 'La conformité MIF2 est enfin un non-sujet. Tout est tracé, tout est audit-ready.',
      name: 'Thibault Roussel',
      role: 'CGP associé, Roussel & Associés',
    },
    {
      q: 'Le pricing est fiable en vingt secondes, directement utilisable en rendez-vous client.',
      name: 'Émilie Fontaine',
      role: 'Produits structurés, Assurances Méridien',
    },
  ];
  return (
    <section
      style={{
        background: 'var(--redesign-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="tag-eyebrow" style={{ marginBottom: 48 }}>
          Témoignages
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            borderTop: '1px solid var(--redesign-border)',
          }}
        >
          {tes.map((t, i) => (
            <div
              key={i}
              style={{
                padding: '40px 32px 40px 0',
                borderRight:
                  i < 2 ? '1px solid var(--redesign-border)' : 'none',
                paddingLeft: i > 0 ? 32 : 0,
              }}
            >
              <p
                className="font-display-new"
                style={{
                  fontSize: 20,
                  lineHeight: 1.4,
                  color: 'var(--redesign-text-primary)',
                  margin: '0 0 32px',
                  letterSpacing: '-0.015em',
                  fontWeight: 500,
                }}
              >
                <span style={{ fontStyle: 'italic' }}>«</span> {t.q}{' '}
                <span style={{ fontStyle: 'italic' }}>»</span>
              </p>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--redesign-text-tertiary)',
                  marginTop: 2,
                }}
              >
                {t.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Security ────────────────────────────────────────────────────────────────
function SecuritySection() {
  const items = [
    {
      t: 'MIF2 & DDA',
      b: 'Conformité vérifiée à chaque transaction, traçabilité complète.',
    },
    {
      t: 'RGPD',
      b: 'Hébergement en Europe. Vos données ne quittent jamais l\u2019UE.',
    },
    {
      t: 'Chiffrement',
      b: 'TLS 1.3 et chiffrement au repos. SOC 2 Type II en cours.',
    },
    {
      t: '2FA',
      b: 'Double authentification obligatoire pour les comptes institutionnels.',
    },
  ];
  return (
    <section
      style={{
        background: 'var(--redesign-off-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 64, maxWidth: 640 }}>
          <div className="tag-eyebrow" style={{ marginBottom: 24 }}>
            Sécurité
          </div>
          <h2
            className="font-display-new"
            style={{
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--redesign-text-primary)',
            }}
          >
            Conçu pour les professionnels régulés.
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
            borderTop: '1px solid var(--redesign-border)',
          }}
        >
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                padding: '32px 24px 32px 0',
                borderRight:
                  i < 3 ? '1px solid var(--redesign-border)' : 'none',
                paddingLeft: i > 0 ? 24 : 0,
              }}
            >
              <div
                className="font-mono-new"
                style={{
                  fontSize: 11,
                  color: 'var(--redesign-text-tertiary)',
                  marginBottom: 14,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  margin: '0 0 8px',
                  color: 'var(--redesign-text-primary)',
                }}
              >
                {it.t}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--redesign-text-secondary)',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {it.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FaqSection() {
  const [open, setOpen] = useState<number>(0);
  const faqs = [
    {
      q: "Combien de temps dure l'onboarding ?",
      a: 'Dix minutes en moyenne. Vous renseignez vos numéros ORIAS et AMF, nous vérifions automatiquement leur validité, puis vous signez la convention distributeur. Vous pouvez pricer dès la validation.',
    },
    {
      q: 'Quels types de produits sont disponibles ?',
      a: 'Autocall, Phoenix Mémoire, Reverse Convertible, Capital Protégé, Bonus Cappé, et certificats indexés. Plus de cent fiches actives en permanence, sur plus de trente sous-jacents.',
    },
    {
      q: 'Les émetteurs voient-ils mes clients ?',
      a: "Non, jamais. Seuls votre cabinet et son SIREN sont transmis à l'émetteur. L'identité du client souscripteur ne quitte jamais votre CRM.",
    },
    {
      q: 'Comment sont calculées les commissions ?',
      a: "Les commissions d'apport et de suivi sont négociées par produit avec chaque émetteur. Strick'in prélève une commission plateforme forfaitaire par transaction, visible avant souscription.",
    },
    {
      q: 'Quelle est la conformité réglementaire ?',
      a: "Strick'in est enregistré ORIAS comme courtier intermédiaire, et détient le statut PSAN auprès de l'AMF. Tous les flux MIF2 (cible client, rémunération, adéquation) sont tracés et exportables.",
    },
    {
      q: 'Puis-je tester avant de m\u2019engager ?',
      a: "Oui. Un environnement bac à sable est accessible trente jours, avec toutes les fonctionnalités et de faux produits. Aucun engagement, aucune carte bancaire.",
    },
  ];
  return (
    <section
      style={{
        background: 'var(--redesign-off-white)',
        padding: '140px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className="tag-eyebrow" style={{ marginBottom: 32 }}>
          FAQ
        </div>
        <h2
          className="font-display-new"
          style={{
            fontSize: 48,
            fontWeight: 700,
            margin: '0 0 56px',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--redesign-text-primary)',
          }}
        >
          Questions fréquentes.
        </h2>
        <div style={{ borderTop: '1px solid var(--redesign-border)' }}>
          {faqs.map((f, i) => (
            <div
              key={i}
              style={{
                borderBottom: '1px solid var(--redesign-border)',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: '100%',
                  padding: '24px 0',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  className="font-display-new"
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--redesign-text-primary)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  {f.q}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    color: 'var(--redesign-text-tertiary)',
                    transform: open === i ? 'rotate(45deg)' : 'none',
                    transition: 'transform 200ms',
                    display: 'inline-block',
                    width: 20,
                    textAlign: 'center',
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div
                  style={{ paddingBottom: 24, paddingRight: 48 }}
                  className="animate-fade-up"
                >
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: 'var(--redesign-text-secondary)',
                      margin: 0,
                    }}
                  >
                    {f.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section
      style={{
        background: 'var(--redesign-white)',
        padding: '160px 32px',
        borderBottom: '1px solid var(--redesign-border)',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h2
          className="font-display-new"
          style={{
            fontSize: 56,
            fontWeight: 700,
            margin: '0 0 24px',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: 'var(--redesign-text-primary)',
          }}
        >
          Prêt à essayer ?
        </h2>
        <p
          style={{
            fontSize: 17,
            color: 'var(--redesign-text-secondary)',
            margin: '0 auto 40px',
            maxWidth: 480,
          }}
        >
          Trente jours d&apos;essai. Sans carte bancaire. Sans engagement.
        </p>
        <Link
          href="/login"
          className="btn-new btn-primary-new btn-lg-new"
          style={{ padding: '0 32px' }}
        >
          Demander un accès →
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function LandingFooter() {
  const cols: { t: string; l: { label: string; href: string }[] }[] = [
    {
      t: 'Produit',
      l: [
        { label: 'Catalogue', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'RFQ', href: '#' },
        { label: 'Research', href: '#' },
        { label: 'Tokenisation', href: '/tokenisation' },
      ],
    },
    {
      t: 'Entreprise',
      l: [
        { label: 'À propos', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Carrières', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      t: 'Légal',
      l: [
        { label: 'CGU', href: '/cgu' },
        { label: 'Confidentialité', href: '/confidentialite' },
        { label: 'Mentions', href: '/mentions-legales' },
        { label: 'Sécurité', href: '#' },
      ],
    },
  ];
  return (
    <footer
      style={{
        background: 'var(--redesign-white)',
        padding: '64px 32px 32px',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 48,
        }}
      >
        <div>
          <div
            className="font-display-new"
            style={{
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--redesign-text-primary)',
            }}
          >
            Strick&apos;in
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              margin: '16px 0 0',
              maxWidth: 280,
              color: 'var(--redesign-text-secondary)',
            }}
          >
            Marketplace B2B des produits structurés.
          </p>
        </div>
        {cols.map((c, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
                color: 'var(--redesign-text-primary)',
              }}
            >
              {c.t}
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {c.l.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    style={{
                      fontSize: 13,
                      color: 'var(--redesign-text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1180,
          margin: '48px auto 0',
          paddingTop: 24,
          borderTop: '1px solid var(--redesign-border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--redesign-text-tertiary)',
        }}
      >
        <span>© {new Date().getFullYear()} Strick&apos;in SAS</span>
        <span>RCS Paris 902 458 177 · ORIAS 22 004 128</span>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div
      style={{
        background: 'var(--redesign-off-white)',
        color: 'var(--redesign-text-primary)',
        minHeight: '100vh',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <LandingNavbar />
      <HeroSection />
      <LandingTicker />
      <FeaturesSection />
      <ComparatorDemo />
      <RolesSection />
      <IssuersSection />
      <WhyStrickinSection />
      <ProcessSection />
      <TestimonialsSection />
      <SecuritySection />
      <FaqSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
