// ─── Strick'in vs Competitors — feature matrix ─────────────────────────────
// Used by the `ComparisonTable` marketing component on the landing page and
// on the dedicated /vs-feefty and /vs-luma SEO pages.

export type CompetitorCellValue = string | boolean;

export interface CompetitorCell {
  value: CompetitorCellValue;
  note?: string;
}

export interface ComparisonRow {
  category: string;
  feature: string;
  strickin: CompetitorCell;
  feefty: CompetitorCell;
  luma: CompetitorCell;
}

export const COMPARISON_CATEGORIES = [
  'Distribution & Catalogue',
  'IA & Intelligence',
  'Conformité réglementaire',
  'Workflow & Automatisation',
  'Émetteurs & Liquidité',
  'Onboarding & Temps',
] as const;

export type ComparisonCategory = (typeof COMPARISON_CATEGORIES)[number];

// Helper shorthand
const yes = (note?: string): CompetitorCell => ({ value: true, note });
const no = (note?: string): CompetitorCell => ({ value: false, note });
const txt = (value: string, note?: string): CompetitorCell => ({ value, note });

export const COMPARISON_ROWS: ComparisonRow[] = [
  // ── Distribution & Catalogue ──────────────────────────────────────────────
  {
    category: 'Distribution & Catalogue',
    feature: 'Multi-émetteurs RFQ (5+ émetteurs simultanés)',
    strickin: yes('BNP, Natixis, SG, Goldman, JPM'),
    feefty: yes('3-4 émetteurs'),
    luma: yes('Marketplace US/EU'),
  },
  {
    category: 'Distribution & Catalogue',
    feature: 'Catalogue structurés 100% français',
    strickin: yes('Produits conformes MIF II & PRIIPs'),
    feefty: yes(),
    luma: no('Catalogue US-centric'),
  },
  {
    category: 'Distribution & Catalogue',
    feature: 'Plateforme indépendante (non captive)',
    strickin: yes('Aucun actionnariat émetteur'),
    feefty: no('Partenariats privilégiés'),
    luma: yes(),
  },
  {
    category: 'Distribution & Catalogue',
    feature: 'Marketplace SMA (Shared Marketplace Access)',
    strickin: yes('Pooling inter-CGP'),
    feefty: no(),
    luma: yes('Reserved Marketplace'),
  },
  {
    category: 'Distribution & Catalogue',
    feature: 'Multi-pays (LU / BE / CH)',
    strickin: yes('Passeport UE + Suisse'),
    feefty: no('France uniquement'),
    luma: no('Pas d’EMEA complet'),
  },
  {
    category: 'Distribution & Catalogue',
    feature: 'Tokenisation-ready (DLT Pilot Regime)',
    strickin: yes('Architecture compatible T+0'),
    feefty: no(),
    luma: no(),
  },

  // ── IA & Intelligence ─────────────────────────────────────────────────────
  {
    category: 'IA & Intelligence',
    feature: 'IA Auto-Commentary (explainer produit)',
    strickin: yes('Synthèse client en 1 clic'),
    feefty: no(),
    luma: no(),
  },
  {
    category: 'IA & Intelligence',
    feature: 'Scoring IA CGP (Health Score portefeuille)',
    strickin: yes('Score 0-100 multi-critères'),
    feefty: no(),
    luma: no(),
  },
  {
    category: 'IA & Intelligence',
    feature: 'Agent IA recommandations',
    strickin: yes('Top 5 produits adaptés'),
    feefty: no(),
    luma: txt('Bêta limitée'),
  },
  {
    category: 'IA & Intelligence',
    feature: 'Détection automatique greenwashing ESG',
    strickin: yes('Flags SFDR Art. 8 / 9'),
    feefty: no(),
    luma: no(),
  },
  {
    category: 'IA & Intelligence',
    feature: 'Stress-tests IA (scénarios macro)',
    strickin: yes('Crash, taux, inflation'),
    feefty: no(),
    luma: no(),
  },

  // ── Conformité réglementaire ──────────────────────────────────────────────
  {
    category: 'Conformité réglementaire',
    feature: 'DER & rapport d’adéquation auto-générés',
    strickin: yes('PDF MIF II prêt à signer'),
    feefty: txt('Semi-manuel'),
    luma: no('Non adapté FR'),
  },
  {
    category: 'Conformité réglementaire',
    feature: 'Reporting AMF / ACPR',
    strickin: yes('Export conforme 2024'),
    feefty: yes(),
    luma: no(),
  },
  {
    category: 'Conformité réglementaire',
    feature: 'Module ESG SFDR + PRIIPs (KID auto)',
    strickin: yes('KID PRIIPs v2 + taxonomie'),
    feefty: txt('KID seulement'),
    luma: no(),
  },
  {
    category: 'Conformité réglementaire',
    feature: '7 questions AMF intégrées au parcours',
    strickin: yes('Profil investisseur obligatoire'),
    feefty: no(),
    luma: no(),
  },

  // ── Workflow & Automatisation ─────────────────────────────────────────────
  {
    category: 'Workflow & Automatisation',
    feature: 'Signature électronique Yousign',
    strickin: yes('Natif, eIDAS qualifié'),
    feefty: yes('DocuSign'),
    luma: no(),
  },
  {
    category: 'Workflow & Automatisation',
    feature: 'Overbooking FIFO (20-30 %)',
    strickin: yes('Pipeline engagement-first'),
    feefty: no(),
    luma: no(),
  },
  {
    category: 'Workflow & Automatisation',
    feature: 'Notifications temps réel (events produit)',
    strickin: yes('Push + email + in-app'),
    feefty: txt('Email uniquement'),
    luma: yes(),
  },
  {
    category: 'Workflow & Automatisation',
    feature: 'Export ICS calendrier observations',
    strickin: yes('1 clic → Google / Outlook'),
    feefty: no(),
    luma: no(),
  },

  // ── Émetteurs & Liquidité ─────────────────────────────────────────────────
  {
    category: 'Émetteurs & Liquidité',
    feature: 'API émetteurs temps réel',
    strickin: yes('Pricing J+0'),
    feefty: txt('Batch J+1'),
    luma: yes(),
  },
  {
    category: 'Émetteurs & Liquidité',
    feature: 'Liquidité secondaire (bid / ask live)',
    strickin: yes('Spread garanti 48 h'),
    feefty: no(),
    luma: yes('Spread US'),
  },
  {
    category: 'Émetteurs & Liquidité',
    feature: 'Émetteur par produit (transparence totale)',
    strickin: yes('Mention ISIN + prospectus'),
    feefty: yes(),
    luma: yes(),
  },

  // ── Onboarding & Temps ────────────────────────────────────────────────────
  {
    category: 'Onboarding & Temps',
    feature: 'Onboarding ORIAS + KYC en 10 min',
    strickin: yes('Vérif. auto API ORIAS'),
    feefty: no('48-72 h manuel'),
    luma: no(),
  },
  {
    category: 'Onboarding & Temps',
    feature: 'Academy & formation CGP intégrée',
    strickin: yes('Parcours certifiant 15 h'),
    feefty: no(),
    luma: no(),
  },
  {
    category: 'Onboarding & Temps',
    feature: 'Support francophone dédié',
    strickin: yes('Équipe Paris, 9h-19h'),
    feefty: yes(),
    luma: no('EN only'),
  },
];

// Utility: category → filtered rows
export function rowsByCategory(
  category: ComparisonCategory,
): ComparisonRow[] {
  return COMPARISON_ROWS.filter((r) => r.category === category);
}
