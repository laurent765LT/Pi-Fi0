// ─── SFDR / ESG Schema ────────────────────────────────────────────────────────
// Sustainable Finance Disclosure Regulation (SFDR) classification + ESG data
// shape used across product cards, detail pages and the assureur dashboard.

export type SFDRClassification = 'art6' | 'art8' | 'art9' | 'non-esg';

export type ExclusionKey =
  | 'tabac'
  | 'armes'
  | 'energies-fossiles'
  | 'charbon'
  | 'alcool-fort'
  | 'jeux';

export interface ESGData {
  overallScore: number; // 0-100
  subScores: {
    environment: number; // 0-100
    social: number;
    governance: number;
  };
  sfdr: SFDRClassification;
  exclusions: ExclusionKey[];
  taxonomyAlignment: number; // 0-100 (%)
  fossilFuelExposure: number; // 0-100 (% of underlying)
}

export interface SFDRLabelEntry {
  label: string;
  fullLabel: string;
  color: string;
}

export const SFDR_LABELS: Record<SFDRClassification, SFDRLabelEntry> = {
  art6: {
    label: 'Art. 6',
    fullLabel: 'SFDR Article 6 \u2014 Sans objectif durable',
    color: '#6B6B6B',
  },
  art8: {
    label: 'Art. 8',
    fullLabel: 'SFDR Article 8 \u2014 Promeut caract\u00e9ristiques E/S',
    color: '#00B894',
  },
  art9: {
    label: 'Art. 9',
    fullLabel: 'SFDR Article 9 \u2014 Objectif investissement durable',
    color: '#008B6E',
  },
  'non-esg': {
    label: 'Non-ESG',
    fullLabel: 'Produit classique',
    color: '#A8A59E',
  },
};

export const EXCLUSION_LABELS: Record<ExclusionKey, string> = {
  tabac: 'Tabac',
  armes: 'Armes controvers\u00e9es',
  'energies-fossiles': '\u00c9nergies fossiles',
  charbon: 'Charbon thermique',
  'alcool-fort': 'Alcool fort',
  jeux: "Jeux d'argent",
};

// Helper used by the detail block + badge to pick a textual level
export function getScoreLevel(score: number): 'excellent' | 'good' | 'average' | 'low' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'low';
}
