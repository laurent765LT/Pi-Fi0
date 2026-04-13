// ─── Assureur Demo Mock Data ─────────────────────────────────────────────────
// Données mockées pour la démo assureur — angle BNP Paribas Cardif
// Toutes les données sont fictives à des fins de démonstration

export interface Produit {
  id: string;
  isin: string;
  nom: string;
  type: 'AUTOCALL_PHOENIX' | 'AUTOCALL_COUPON' | 'CAPITAL_PROTEGE' | 'TAUX_CONDITIONNEL';
  emetteur: string;
  garant: string;
  sousJacent: string;
  barrierePct: number | null;
  rappelPct: number | null;
  couponPct: number | null;
  gainMaxPct: number | null;
  protectionCapitalPct?: number;
  couponTriggerRate?: number;
  recallTriggerRate?: number;
  sri: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  maturite: string;
  fraisEntree: number;
  status: 'ACTIF' | 'FERME';
  datesObservation: string[];
  description?: string;
}

export interface Enveloppe {
  id: string;
  produitId: string;
  statut: 'OUVERT' | 'PLEIN' | 'FERME';
  montantCible: number;
  surbookingPct: number;
  montantConfirme: number;
  montantAttente: number;
  nbInteresses: number;
  dateCloture: string;
}

export interface Engagement {
  id: string;
  enveloppeId: string;
  distributeur: string;
  montant: number;
  statut: 'CONFIRME' | 'EN_ATTENTE' | 'LISTE_ATTENTE';
  date: string;
}

export interface Evenement {
  id: string;
  type: 'CLOTURE' | 'OBSERVATION' | 'COUPON' | 'AUTOCALL';
  produitNom: string;
  produitId: string;
  date: string;
  joursRestants: number;
  urgent: boolean;
}

export interface CollecteMensuelle {
  mois: string;
  montant: number;
}

// ─── Produits ────────────────────────────────────────────────────────────────

export const PRODUITS: Produit[] = [
  {
    id: 'MT3',
    isin: 'FR0014013A96',
    nom: 'M Rendement 13',
    type: 'AUTOCALL_PHOENIX',
    emetteur: 'BNP Paribas Issuance B.V.',
    garant: 'BNP Paribas',
    sousJacent: 'Euronext EZ Sector Selection D50P',
    barrierePct: 50,
    rappelPct: 85,
    couponPct: 7.0,
    gainMaxPct: 170,
    sri: 7,
    maturite: '2035-12-17',
    fraisEntree: 5.06,
    status: 'ACTIF',
    description: "Ce produit vous permet de bénéficier d'un coupon de 7% par an si le sous-jacent est au-dessus de 85% de sa valeur initiale à chaque date d'observation. Si le sous-jacent tombe en dessous de 50%, une perte en capital est possible à l'échéance.",
    datesObservation: [
      '2026-12-16', '2027-12-15', '2028-12-13', '2029-12-18',
      '2030-12-18', '2031-12-17', '2032-12-15', '2033-12-14', '2034-12-18',
    ],
  },
  {
    id: 'MT4',
    isin: 'FR0014012O42',
    nom: 'M Rendement OR',
    type: 'CAPITAL_PROTEGE',
    emetteur: 'Natixis Structured Issuance',
    garant: 'BPCE',
    sousJacent: 'iEdge Gold Shares EUR PR Index',
    barrierePct: null,
    rappelPct: null,
    couponPct: null,
    gainMaxPct: 121,
    protectionCapitalPct: 90,
    sri: 2,
    maturite: '2028-12-29',
    fraisEntree: 2.50,
    status: 'ACTIF',
    description: "Capital protégé à 90% indexé sur l'or. Performance plafonnée à 121% du Montant Nominal. Durée 3 ans. Idéal pour les profils prudents cherchant une exposition or.",
    datesObservation: [],
  },
  {
    id: 'MT5',
    isin: 'FR0014013AB5',
    nom: 'M Rendement Mixte',
    type: 'AUTOCALL_COUPON',
    emetteur: 'BNP Paribas Issuance B.V.',
    garant: 'BNP Paribas',
    sousJacent: 'Euronext EZ Sector Selection D50P',
    barrierePct: 50,
    rappelPct: 100,
    couponPct: 3.0,
    gainMaxPct: 150,
    sri: 4,
    maturite: '2035-12-17',
    fraisEntree: 5.93,
    status: 'ACTIF',
    description: "Autocall avec coupon fixe de 3% de la Valeur Nominale Courante. Taux de sortie croissant de 5% à 45%. Barrière de protection à 50%.",
    datesObservation: [
      '2026-12-16', '2027-12-15', '2028-12-13', '2029-12-18',
      '2030-12-18', '2031-12-17', '2032-12-15', '2033-12-14', '2034-12-18',
    ],
  },
  {
    id: 'MT6',
    isin: 'FR0014011938',
    nom: 'M Equilibre CT',
    type: 'TAUX_CONDITIONNEL',
    emetteur: 'SG Issuer',
    garant: 'Société Générale',
    sousJacent: 'EUR EURIBOR 12 Months',
    barrierePct: null,
    rappelPct: null,
    couponPct: 6.15,
    couponTriggerRate: 2.4,
    recallTriggerRate: 1.8,
    gainMaxPct: null,
    protectionCapitalPct: 100,
    sri: 2,
    maturite: '2037-10-05',
    fraisEntree: 8.18,
    status: 'ACTIF',
    description: "Coupon conditionnel de 6,15% p.a. si EUR CMS 10 ans ≤ 2,4%. Capital intégralement protégé à maturité. Remboursement anticipé automatique si taux ≤ 1,8%.",
    datesObservation: [
      '2026-10-05', '2027-10-05', '2028-10-03', '2029-10-03',
      '2030-10-03', '2031-10-06', '2032-10-05', '2033-10-05',
      '2034-10-04', '2035-10-03', '2036-10-03',
    ],
  },
];

// ─── Enveloppes ──────────────────────────────────────────────────────────────

export const ENVELOPPES: Enveloppe[] = [
  {
    id: 'ENV-001',
    produitId: 'MT3',
    statut: 'OUVERT',
    montantCible: 10_000_000,
    surbookingPct: 25,
    montantConfirme: 6_800_000,
    montantAttente: 2_200_000,
    nbInteresses: 23,
    dateCloture: '2026-04-15',
  },
  {
    id: 'ENV-002',
    produitId: 'MT5',
    statut: 'OUVERT',
    montantCible: 8_000_000,
    surbookingPct: 20,
    montantConfirme: 3_200_000,
    montantAttente: 800_000,
    nbInteresses: 11,
    dateCloture: '2026-05-30',
  },
  {
    id: 'ENV-003',
    produitId: 'MT4',
    statut: 'FERME',
    montantCible: 5_000_000,
    surbookingPct: 20,
    montantConfirme: 6_000_000,
    montantAttente: 0,
    nbInteresses: 18,
    dateCloture: '2026-02-28',
  },
];

// ─── Engagements ─────────────────────────────────────────────────────────────

export const ENGAGEMENTS: Engagement[] = [
  { id: 'ENG-001', enveloppeId: 'ENV-001', distributeur: 'Cabinet Dupont CGP', montant: 500_000, statut: 'CONFIRME', date: '2026-03-10' },
  { id: 'ENG-002', enveloppeId: 'ENV-001', distributeur: 'Patrimoine & Conseil', montant: 1_000_000, statut: 'CONFIRME', date: '2026-03-12' },
  { id: 'ENG-003', enveloppeId: 'ENV-001', distributeur: 'Gestion Privée SAS', montant: 300_000, statut: 'EN_ATTENTE', date: '2026-03-14' },
  { id: 'ENG-004', enveloppeId: 'ENV-001', distributeur: 'Alpha Patrimoine', montant: 750_000, statut: 'CONFIRME', date: '2026-03-15' },
  { id: 'ENG-005', enveloppeId: 'ENV-001', distributeur: 'Rivière & Associés', montant: 400_000, statut: 'CONFIRME', date: '2026-03-08' },
  { id: 'ENG-006', enveloppeId: 'ENV-001', distributeur: 'Finance & Héritage', montant: 850_000, statut: 'CONFIRME', date: '2026-03-05' },
  { id: 'ENG-007', enveloppeId: 'ENV-001', distributeur: 'LB Conseil Patrimoine', montant: 600_000, statut: 'EN_ATTENTE', date: '2026-03-17' },
  { id: 'ENG-008', enveloppeId: 'ENV-001', distributeur: 'Optima Finance', montant: 200_000, statut: 'CONFIRME', date: '2026-03-11' },
  { id: 'ENG-009', enveloppeId: 'ENV-002', distributeur: 'Cabinet Moreau', montant: 200_000, statut: 'CONFIRME', date: '2026-03-08' },
  { id: 'ENG-010', enveloppeId: 'ENV-002', distributeur: 'Conseil & Avenir', montant: 400_000, statut: 'EN_ATTENTE', date: '2026-03-18' },
  { id: 'ENG-011', enveloppeId: 'ENV-002', distributeur: 'Patrimoine & Conseil', montant: 600_000, statut: 'CONFIRME', date: '2026-03-09' },
  { id: 'ENG-012', enveloppeId: 'ENV-003', distributeur: 'Cabinet Dupont CGP', montant: 800_000, statut: 'CONFIRME', date: '2026-02-10' },
  { id: 'ENG-013', enveloppeId: 'ENV-003', distributeur: 'Alpha Patrimoine', montant: 1_200_000, statut: 'CONFIRME', date: '2026-02-12' },
  { id: 'ENG-014', enveloppeId: 'ENV-003', distributeur: 'Finance & Héritage', montant: 500_000, statut: 'CONFIRME', date: '2026-02-15' },
];

// ─── Événements ──────────────────────────────────────────────────────────────

export const EVENEMENTS: Evenement[] = [
  { id: 'EVT-001', type: 'CLOTURE', produitNom: 'M Rendement 13', produitId: 'MT3', date: '2026-04-15', joursRestants: 21, urgent: true },
  { id: 'EVT-002', type: 'CLOTURE', produitNom: 'M Rendement Mixte', produitId: 'MT5', date: '2026-05-30', joursRestants: 66, urgent: false },
  { id: 'EVT-003', type: 'OBSERVATION', produitNom: 'M Equilibre CT', produitId: 'MT6', date: '2026-10-05', joursRestants: 194, urgent: false },
  { id: 'EVT-004', type: 'COUPON', produitNom: 'M Rendement Mixte', produitId: 'MT5', date: '2026-12-16', joursRestants: 266, urgent: false },
];

// ─── Collecte Mensuelle ──────────────────────────────────────────────────────

export const COLLECTE_MENSUELLE: CollecteMensuelle[] = [
  { mois: 'Oct', montant: 1_200_000 },
  { mois: 'Nov', montant: 1_800_000 },
  { mois: 'Déc', montant: 950_000 },
  { mois: 'Jan', montant: 2_100_000 },
  { mois: 'Fév', montant: 2_800_000 },
  { mois: 'Mar', montant: 3_400_000 },
];

// ─── Assureur ────────────────────────────────────────────────────────────────

export const ASSUREUR_DEMO = {
  nom: 'BNP Paribas Cardif',
  contact: 'Delphine Mantz',
  role: 'Directrice réseaux CGP & Courtiers',
  email: 'cardif@demo.com',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatMontant(amount: number): string {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 1, notation: 'compact',
    }).format(amount);
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMontantFull(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateFR(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function formatDateShortFR(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function getProduit(id: string): Produit | undefined {
  return PRODUITS.find((p) => p.id === id);
}

export function getEnveloppe(produitId: string): Enveloppe | undefined {
  return ENVELOPPES.find((e) => e.produitId === produitId);
}

export function getEngagements(enveloppeId: string): Engagement[] {
  return ENGAGEMENTS.filter((e) => e.enveloppeId === enveloppeId);
}

// ─── Type configs ────────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTEGE: 'Capital Protégé',
  TAUX_CONDITIONNEL: 'Taux Conditionnel',
};

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  AUTOCALL_PHOENIX: { bg: '#EEF0FD', text: '#3B28CC' },
  AUTOCALL_COUPON: { bg: '#DBEAFE', text: '#2563EB' },
  CAPITAL_PROTEGE: { bg: '#D1FAE5', text: '#059669' },
  TAUX_CONDITIONNEL: { bg: '#CCFBF1', text: '#0D9488' },
};

export const SRI_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: '#D1FAE5', text: '#059669', label: 'Faible' },
  2: { bg: '#D1FAE5', text: '#059669', label: 'Faible' },
  3: { bg: '#FEF3C7', text: '#D97706', label: 'Modéré' },
  4: { bg: '#FEF3C7', text: '#D97706', label: 'Modéré' },
  5: { bg: '#FFEDD5', text: '#EA580C', label: 'Élevé' },
  6: { bg: '#FFEDD5', text: '#EA580C', label: 'Élevé' },
  7: { bg: '#FEE2E2', text: '#DC2626', label: 'Très élevé' },
};

export const STATUT_ENVELOPPE: Record<string, { bg: string; text: string; label: string }> = {
  OUVERT: { bg: '#D1FAE5', text: '#059669', label: 'Ouvert' },
  PLEIN: { bg: '#FEF3C7', text: '#D97706', label: 'Plein' },
  FERME: { bg: '#F3F4F6', text: '#6B7280', label: 'Fermé' },
};

export const STATUT_ENGAGEMENT: Record<string, { bg: string; text: string; label: string }> = {
  CONFIRME: { bg: '#D1FAE5', text: '#059669', label: 'Confirmé' },
  EN_ATTENTE: { bg: '#FEF3C7', text: '#D97706', label: 'En attente' },
  LISTE_ATTENTE: { bg: '#FEE2E2', text: '#DC2626', label: 'Liste d\'attente' },
};

export const EVENT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CLOTURE: { color: '#DC2626', bg: '#FEE2E2', label: 'Clôture' },
  OBSERVATION: { color: '#2563EB', bg: '#DBEAFE', label: 'Observation' },
  COUPON: { color: '#059669', bg: '#D1FAE5', label: 'Coupon' },
  AUTOCALL: { color: '#3B28CC', bg: '#EEF0FD', label: 'Autocall' },
};
