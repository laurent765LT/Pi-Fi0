import { MIF2_GUARDRAILS } from './guardrails';

export interface ProductInput {
  isin: string;
  name: string;
  payoffType: string;
  issuerName: string;
  guarantorName?: string | null;
  underlyingName: string;
  underlyingTicker?: string | null;
  barrierCapPct?: number | null;
  autocallBarrierPct?: number | null;
  couponPct?: number | null;
  maxGainPct?: number | null;
  sri: number;
  maturityDate: string;
  entryFeePct?: number | null;
  description?: string | null;
}

export interface ClientProfile {
  experienceLevel: 'novice' | 'intermediate' | 'expert';
  riskTolerance: 'low' | 'medium' | 'high';
  investmentHorizon: 'short' | 'medium' | 'long';
  preferredLanguage?: 'fr' | 'en';
}

export const PRODUCT_COMMENTARY_V1 = {
  version: '1.0.0',
  name: 'product-commentary',
  systemPrompt: `Tu es un rédacteur financier spécialisé en produits structurés. Tu produis un commentaire pédagogique, neutre, calibré au niveau d'expertise du client cible.

Ton mission : rédiger une fiche pédagogique de 3 à 5 paragraphes expliquant :
1. La mécanique du produit (barrières, coupons, autocall, capital).
2. Les scénarios de déclenchement (favorable, neutre, défavorable).
3. Le profil de client pour lequel le produit est GÉNÉRIQUEMENT adapté (sans nommer personne).
4. Les risques principaux à retenir.

Règles de style :
- Niveau "novice" : vulgarise, peu de jargon, définitions intégrées.
- Niveau "intermediate" : jargon standard PRIIPs assumé.
- Niveau "expert" : ton technique, données chiffrées, pas de pédagogie de base.
- Ne jamais inviter à l'achat, ne jamais formuler "vous devriez".
- Toujours parler au conditionnel ou en généralités.

${MIF2_GUARDRAILS}`,
  buildUserPrompt: (product: ProductInput, profile: ClientProfile): string => {
    return `Rédige un commentaire pédagogique pour le produit suivant, adapté à un client de profil ${profile.experienceLevel} (tolérance ${profile.riskTolerance}, horizon ${profile.investmentHorizon}).

Produit :
- ISIN : ${product.isin}
- Nom : ${product.name}
- Type de payoff : ${product.payoffType}
- Émetteur : ${product.issuerName}${product.guarantorName ? ` (garant : ${product.guarantorName})` : ''}
- Sous-jacent : ${product.underlyingName}${product.underlyingTicker ? ` (${product.underlyingTicker})` : ''}
- Barrière capital : ${product.barrierCapPct !== null && product.barrierCapPct !== undefined ? `${product.barrierCapPct}%` : 'N/A'}
- Barrière autocall : ${product.autocallBarrierPct !== null && product.autocallBarrierPct !== undefined ? `${product.autocallBarrierPct}%` : 'N/A'}
- Coupon : ${product.couponPct !== null && product.couponPct !== undefined ? `${product.couponPct}% p.a.` : 'N/A'}
- Gain maximal : ${product.maxGainPct !== null && product.maxGainPct !== undefined ? `${product.maxGainPct}%` : 'N/A'}
- SRI : ${product.sri}/7
- Maturité : ${product.maturityDate}
- Frais d'entrée : ${product.entryFeePct !== null && product.entryFeePct !== undefined ? `${product.entryFeePct}%` : 'N/A'}
${product.description ? `- Description émetteur : ${product.description}` : ''}

Rédige directement le commentaire, sans préambule.`;
  },
} as const;
