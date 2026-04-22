// ─── Target Market PRIIPs / MiFID II schema ─────────────────────────────────
// Dimensions utilisees pour decrire le Target Market positif d'un produit
// structure et le profil d'un client CGP afin de calculer l'adequation
// (suitability) au sens du reglement PRIIPs et de la directive MIF II.
//
// Les libelles francais definis dans LABELS doivent etre utilises pour
// l'affichage utilisateur. Les identifiants techniques sont stables pour
// pouvoir etre persistes/serialises sans migration.

export const KNOWLEDGE_LEVELS = ['basique', 'informe', 'averti', 'expert'] as const;
export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number];

export const EXPERIENCE_LEVELS = ['moins1an', '1a3ans', '3a5ans', 'plus5ans'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const LOSS_CAPACITY = [0, 10, 30, 100] as const;
export type LossCapacity = (typeof LOSS_CAPACITY)[number];

export const RISK_TOLERANCE = ['tresfaible', 'faible', 'moyenne', 'elevee'] as const;
export type RiskTolerance = (typeof RISK_TOLERANCE)[number];

export const OBJECTIVES = ['preservation', 'revenus', 'croissance', 'speculation'] as const;
export type Objective = (typeof OBJECTIVES)[number];

export const HORIZONS = ['moins3ans', '3a5ans', '5a8ans', 'plus8ans'] as const;
export type Horizon = (typeof HORIZONS)[number];

/**
 * Target Market positif d'un produit : ensemble des valeurs acceptables
 * pour chaque dimension. Un client est adequat sur une dimension si sa
 * valeur (ou une de ses valeurs pour les dimensions multi-selection) est
 * presente dans le tableau correspondant.
 */
export interface TargetMarket {
  knowledge: KnowledgeLevel[];
  experience: ExperienceLevel[];
  lossCapacity: LossCapacity[];
  riskTolerance: RiskTolerance[];
  objectives: Objective[];
  horizons: Horizon[];
}

/**
 * Profil reel d'un client. La plupart des dimensions sont mono-valeur ;
 * seuls les objectifs peuvent etre multiples (un client peut rechercher
 * a la fois revenus et croissance par exemple).
 */
export interface ClientProfile {
  knowledge: KnowledgeLevel;
  experience: ExperienceLevel;
  lossCapacity: LossCapacity;
  riskTolerance: RiskTolerance;
  objectives: Objective[];
  horizon: Horizon;
}

// ─── Labels FR pour affichage ────────────────────────────────────────────────

export const LABELS = {
  knowledge: {
    basique: 'Basique',
    informe: 'Informé',
    averti: 'Averti',
    expert: 'Expert',
  },
  experience: {
    moins1an: '< 1 an',
    '1a3ans': '1 à 3 ans',
    '3a5ans': '3 à 5 ans',
    plus5ans: '> 5 ans',
  },
  lossCapacity: {
    0: '0%',
    10: '≤ 10%',
    30: '≤ 30%',
    100: 'Totale',
  },
  riskTolerance: {
    tresfaible: 'Très faible',
    faible: 'Faible',
    moyenne: 'Moyenne',
    elevee: 'Élevée',
  },
  objectives: {
    preservation: 'Préservation',
    revenus: 'Revenus',
    croissance: 'Croissance',
    speculation: 'Spéculation',
  },
  horizons: {
    moins3ans: '< 3 ans',
    '3a5ans': '3 à 5 ans',
    '5a8ans': '5 à 8 ans',
    plus8ans: '> 8 ans',
  },
} as const;

export const DIMENSION_LABELS = {
  knowledge: 'Connaissance',
  experience: 'Expérience',
  lossCapacity: 'Capacité de perte',
  riskTolerance: 'Tolérance au risque',
  objectives: 'Objectifs',
  horizon: 'Horizon',
} as const;

export type DimensionKey = keyof typeof DIMENSION_LABELS;
