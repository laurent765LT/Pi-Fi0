// ─── 7 questions AMF ─────────────────────────────────────────────────────────
// Synthese reglementaire AMF pour un produit structure : 7 questions
// incontournables que tout distributeur doit pouvoir adresser a un
// investisseur particulier avant toute souscription.
//
// Les reponses sont derivees de maniere deterministe des champs existants
// du produit (Product dans demo-data / API). Le bloc associe affichera ces
// informations en haut de la fiche produit pour une visibilite maximale.

// ─── Type produit minimal attendu ───────────────────────────────────────────
// On reste permissif (compatible avec DEMO_PRODUCTS non typed strictement)
// mais en expliquant les champs utilises.

export interface AMFProduct {
  id?: string;
  isin?: string | null;
  name?: string | null;
  payoffType?: string | null;
  issuerName?: string | null;
  underlyingName?: string | null;
  underlyingYahoo?: string | null;
  barrierCapPct?: number | null;
  autocallBarrierPct?: number | null;
  couponPct?: number | null;
  maxGainPct?: number | null;
  sri?: number | null;
  maturityDate?: string | null;
  entryFeePct?: number | null;
  // Champs optionnels potentiellement utilises par d'autres vues
  couponFrequency?: string | null;
  couponMemory?: boolean | null;
  currency?: string | null;
}

// ─── Resultat structure ─────────────────────────────────────────────────────

export interface AMFSevenQuestions {
  /** Q1 : Quelle est la duree maximale d'investissement ? */
  maxDuration: string;
  /** Q2 : Quel risque en capital l'investisseur prend-il ? */
  capitalLossRisk: string;
  /** Q3 : Quelle remuneration offre le produit ? */
  remuneration: string;
  /** Q4 : Quel est le risque de credit de l'emetteur ? */
  issuerCreditRisk: string;
  /** Q5 : Peut-on sortir avant l'echeance ? */
  earlyExit: string;
  /** Q6 : Quel est le sous-jacent / mecanisme ? */
  underlying: string;
  /** Q7 : Quels sont les frais ? */
  fees: string;
}

// ─── Helpers de formatage ───────────────────────────────────────────────────

function fmtYears(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const maturity = new Date(iso);
  if (Number.isNaN(maturity.getTime())) return null;
  const years = (maturity.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years <= 0) return 'Échu';
  const rounded = Math.round(years * 10) / 10;
  return rounded === Math.round(rounded)
    ? `${Math.round(rounded)} an${Math.round(rounded) > 1 ? 's' : ''}`
    : `${rounded.toFixed(1)} ans`;
}

function fmtDateFR(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fmtPct(v: number | null | undefined, digits: number = 1): string | null {
  if (v == null || Number.isNaN(v)) return null;
  return `${v.toFixed(digits)}%`;
}

// ─── Heuristique rating emetteur ────────────────────────────────────────────

/**
 * Approximation indicative du rating S&P des principaux emetteurs europeens
 * a avril 2026. Utilisee comme mock pour la Q4 ; remplacable par une source
 * live (Bloomberg/Reuters) en production.
 */
const ISSUER_RATINGS: Record<string, string> = {
  'BNP Paribas': 'A+',
  'BNP Paribas Issuance B.V.': 'A+',
  'Natixis Structured Issuance': 'A',
  'SG Issuer': 'A',
  'Société Générale': 'A',
  'Goldman Sachs International': 'A+',
  'Goldman Sachs Finance Corp International Ltd': 'A+',
  'Credit Suisse International': 'A-',
  'Morgan Stanley': 'A+',
  'JP Morgan Structured Products': 'A+',
  'Barclays Bank PLC': 'A+',
  'HSBC France': 'AA-',
  'UBS AG': 'A+',
};

function lookupIssuerRating(issuer: string | null | undefined): string {
  if (!issuer) return 'Non renseigné';
  // Match exact puis contains
  if (ISSUER_RATINGS[issuer]) return ISSUER_RATINGS[issuer] ?? 'Non renseigné';
  const key = Object.keys(ISSUER_RATINGS).find(
    (k) => issuer.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(issuer.toLowerCase()),
  );
  return key ? ISSUER_RATINGS[key] ?? 'Non publié' : 'Non publié';
}

// ─── Libelles payoff / autocall ─────────────────────────────────────────────

const PAYOFF_EXIT_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall automatique aux dates d\'observation',
  AUTOCALL_COUPON: 'Autocall automatique aux dates d\'observation',
  CAPITAL_PROTECTED: 'Remboursement à l\'échéance, liquidité secondaire indicative',
  CONDITIONAL_RATE: 'Remboursement à l\'échéance si conditions non remplies',
  BARRIER_NOTE: 'Remboursement à l\'échéance, sortie anticipée non garantie',
};

// ─── Computation ────────────────────────────────────────────────────────────

/**
 * Genere les 7 reponses AMF a partir d'un produit structure. Toutes les
 * valeurs sont en francais, formatees pour affichage direct en UI ou PDF.
 * En cas de donnee manquante, un libelle neutre ("Non renseigne") est
 * utilise plutot que de jeter une erreur.
 */
export function computeAMFSevenQuestions(product: AMFProduct): AMFSevenQuestions {
  // Q1 — Duree maximale
  const yearsLabel = fmtYears(product.maturityDate);
  const maturityFull = fmtDateFR(product.maturityDate);
  const maxDuration = yearsLabel && maturityFull
    ? `${yearsLabel} (échéance ${maturityFull})`
    : yearsLabel ?? maturityFull ?? 'Non renseignée';

  // Q2 — Risque en capital
  const barrier = product.barrierCapPct;
  let capitalLossRisk: string;
  if (barrier == null) {
    capitalLossRisk = 'Non renseigné';
  } else if (barrier >= 100) {
    capitalLossRisk = 'Capital intégralement protégé à l\'échéance';
  } else {
    const lossMax = Math.round(100 - barrier);
    capitalLossRisk = `Jusqu'à ${lossMax}% du capital (barrière ${barrier}%)`;
  }

  // Q3 — Remuneration
  let remuneration: string;
  const coupon = fmtPct(product.couponPct);
  const maxGain = fmtPct(product.maxGainPct);
  if (coupon && product.couponPct && product.couponPct > 0) {
    const memory = product.couponMemory ? ' avec mémoire' : '';
    remuneration = `Coupon conditionnel ${coupon} brut/an${memory}`;
  } else if (maxGain && product.maxGainPct && product.maxGainPct > 0) {
    remuneration = `Gain maximum ${maxGain} à l'échéance`;
  } else {
    remuneration = 'Gain conditionnel aux observations';
  }

  // Q4 — Risque de credit emetteur
  const rating = lookupIssuerRating(product.issuerName);
  const issuerCreditRisk = product.issuerName
    ? `${product.issuerName} — Rating ${rating}`
    : 'Emetteur non renseigné';

  // Q5 — Sortie anticipee
  let earlyExit: string;
  if (product.autocallBarrierPct != null) {
    earlyExit = `Autocall si sous-jacent ≥ ${product.autocallBarrierPct}% aux dates d'observation`;
  } else if (product.payoffType && PAYOFF_EXIT_LABELS[product.payoffType]) {
    earlyExit = PAYOFF_EXIT_LABELS[product.payoffType] ?? 'Sortie anticipée non garantie';
  } else {
    earlyExit = 'Sortie anticipée non garantie';
  }

  // Q6 — Sous-jacent
  const underlying = product.underlyingName
    ?? product.underlyingYahoo
    ?? 'Non renseigné';

  // Q7 — Frais
  const entryFee = fmtPct(product.entryFeePct, 2);
  // Management fee approximatif (structure / enveloppe) — 0,80% par defaut
  const mgmt = '0,80%/an';
  let fees: string;
  if (entryFee) {
    fees = `${entryFee} upfront + ${mgmt} de gestion`;
  } else {
    fees = `${mgmt} de gestion (frais d'entrée variables)`;
  }

  return {
    maxDuration,
    capitalLossRisk,
    remuneration,
    issuerCreditRisk,
    earlyExit,
    underlying,
    fees,
  };
}

// ─── Meta pour affichage (labels, icones via lucide-react) ──────────────────

export interface AMFQuestionMeta {
  /** Cle interne pour React key / dataset. */
  key: keyof AMFSevenQuestions;
  /** Numero affiche (1..7) pour accessibilite. */
  number: number;
  /** Question courte (libelle carte). */
  shortLabel: string;
  /** Question complete pour tooltip / aria-label. */
  longLabel: string;
}

export const AMF_QUESTIONS_META: readonly AMFQuestionMeta[] = [
  {
    key: 'maxDuration',
    number: 1,
    shortLabel: 'Durée',
    longLabel: 'Quelle est la durée maximale d\'investissement ?',
  },
  {
    key: 'capitalLossRisk',
    number: 2,
    shortLabel: 'Risque capital',
    longLabel: 'L\'investisseur prend-il un risque de perte en capital, y compris maximal ?',
  },
  {
    key: 'remuneration',
    number: 3,
    shortLabel: 'Rémunération',
    longLabel: 'Quelle est la rémunération offerte par le produit ?',
  },
  {
    key: 'issuerCreditRisk',
    number: 4,
    shortLabel: 'Risque émetteur',
    longLabel: 'L\'investisseur est-il exposé à un risque de crédit de l\'émetteur ?',
  },
  {
    key: 'earlyExit',
    number: 5,
    shortLabel: 'Sortie anticipée',
    longLabel: 'Peut-on sortir avant l\'échéance et à quel prix ?',
  },
  {
    key: 'underlying',
    number: 6,
    shortLabel: 'Sous-jacent',
    longLabel: 'Quel est le sous-jacent et son mode de calcul ?',
  },
  {
    key: 'fees',
    number: 7,
    shortLabel: 'Frais',
    longLabel: 'Quels sont les frais du produit et de l\'enveloppe ?',
  },
] as const;
