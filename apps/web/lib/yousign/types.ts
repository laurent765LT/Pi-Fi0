// ─── lib/yousign/types.ts ────────────────────────────────────────────────────
// Types partagés pour la signature électronique Yousign (mode mock).
// Aucune clé réelle n'est nécessaire : la simulation est entièrement locale.

export type SignatureLevel = 'simple' | 'advanced' | 'qualified';

export type SignatureStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'refused'
  | 'expired';

export type SignerRole = 'cgp' | 'client' | 'co-souscripteur';

export type SignatureDocumentType =
  | 'fiche-produit'
  | 'bulletin-souscription'
  | 'lettre-mission'
  | 'der'
  | 'kid'
  | 'rapport-adequation';

export interface Signer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: SignerRole;
  order: number;
  status: SignatureStatus;
  signedAt?: string;
  viewedAt?: string;
}

export interface SignatureEvent {
  id: string;
  signerId?: string;
  timestamp: string;
  type: 'created' | 'sent' | 'viewed' | 'signed' | 'refused' | 'expired' | 'reminder';
  message: string;
}

export interface SignatureRequest {
  id: string;
  documentName: string;
  documentType: SignatureDocumentType;
  documentHtml?: string;
  signers: Signer[];
  level: SignatureLevel;
  message?: string;
  status: SignatureStatus;
  createdAt: string;
  completedAt?: string;
  yousignProcedureId?: string; // mock
  events: SignatureEvent[];
}

// ─── Labels & copy ───────────────────────────────────────────────────────────

export const SIGNATURE_LEVEL_LABELS: Record<SignatureLevel, string> = {
  simple: 'Signature simple',
  advanced: 'Signature avancée (AES)',
  qualified: 'Signature qualifiée (QES eIDAS)',
};

export const SIGNATURE_LEVEL_DESCRIPTIONS: Record<SignatureLevel, string> = {
  simple:
    "Consentement par clic. Valeur probante standard, adaptée aux documents de faible enjeu.",
  advanced:
    "Identification renforcée par OTP et contrôle d'identité. Conforme eIDAS, recommandée pour les documents réglementés CIF.",
  qualified:
    "Équivalent juridique d'une signature manuscrite. Certificat qualifié eIDAS, pour les actes à forte portée juridique.",
};

export const SIGNATURE_STATUS_LABELS: Record<SignatureStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  viewed: 'Consultée',
  signed: 'Signée',
  refused: 'Refusée',
  expired: 'Expirée',
};

export const DOCUMENT_TYPE_LABELS: Record<SignatureDocumentType, string> = {
  'fiche-produit': 'Fiche produit',
  'bulletin-souscription': 'Bulletin de souscription',
  'lettre-mission': 'Lettre de mission',
  der: "Document d'entrée en relation",
  kid: 'KID PRIIPs',
  'rapport-adequation': "Rapport d'adéquation",
};

export const SIGNER_ROLE_LABELS: Record<SignerRole, string> = {
  cgp: 'CGP',
  client: 'Client',
  'co-souscripteur': 'Co-souscripteur',
};
