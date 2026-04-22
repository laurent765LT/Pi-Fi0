// ─── Commentary prompt builders ─────────────────────────────────────────────
// Generates system + user prompts for the Claude API used to produce a
// client-facing commentary on a structured product. The output is expected
// to be strict JSON with 4 paragraphs.

import type { ClientProfile, CommentaryTone } from '@/stores/commentary-store';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommentaryProductContext {
  name: string;
  isin: string;
  payoffType: string;
  couponPct?: number;
  barrierPct?: number;
  underlyingName?: string;
  sri?: number;
  maturityDate?: string;
}

export interface CommentaryContext {
  product: CommentaryProductContext;
  clientProfile: ClientProfile;
  objectives: string[];
  tone: CommentaryTone;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROFILE_LABEL: Record<ClientProfile, string> = {
  prudent: 'Prudent (aversion au risque, priorité à la préservation du capital)',
  equilibre: 'Équilibré (tolérance modérée au risque, recherche d\'un équilibre rendement/risque)',
  dynamique: 'Dynamique (tolérance élevée au risque, recherche de performance)',
};

const TONE_LABEL: Record<CommentaryTone, string> = {
  professionnel: 'Professionnel, institutionnel, précis, sobre. Registre CGP/banque privée.',
  pedagogique: 'Pédagogique, accessible, vulgarise les concepts techniques sans les dénaturer.',
  technique: 'Technique, quantitatif, utilise le vocabulaire financier précis (delta, vega, barrière, autocall).',
};

function formatMaturity(iso?: string): string {
  if (!iso) return 'non précisée';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'non précisée';
  }
}

function describeProduct(p: CommentaryProductContext): string {
  const parts: string[] = [
    `- Nom : ${p.name}`,
    `- ISIN : ${p.isin}`,
    `- Type de payoff : ${p.payoffType.replace(/_/g, ' ')}`,
  ];
  if (p.underlyingName) parts.push(`- Sous-jacent : ${p.underlyingName}`);
  if (p.couponPct != null) parts.push(`- Coupon : ${p.couponPct}% p.a.`);
  if (p.barrierPct != null) parts.push(`- Barrière de protection : ${p.barrierPct}%`);
  if (p.sri != null) parts.push(`- SRI : ${p.sri}/7`);
  parts.push(`- Échéance : ${formatMaturity(p.maturityDate)}`);
  return parts.join('\n');
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function buildSystemPrompt(ctx: CommentaryContext): string {
  return [
    "Tu es un expert en produits structurés et en gestion de patrimoine (CGP), rédigeant pour un Conseiller en Gestion de Patrimoine français qui présentera ton texte à son client final.",
    "Tu dois produire un commentaire client personnalisé, conforme à la réglementation MIF II (2014/65/UE) et PRIIPs.",
    "",
    "Règles impératives :",
    "1. Ne fournis jamais de conseil personnalisé en investissement. Formule systématiquement tes propos comme une présentation informative.",
    "2. Ne promets aucune performance. Utilise le conditionnel pour tout scénario futur.",
    "3. Rappelle que le capital n'est pas garanti (sauf produit explicitement capital-protégé) et que les performances passées ne préjugent pas des performances futures.",
    "4. Adapte le niveau de vocabulaire au ton demandé.",
    "5. Réponds STRICTEMENT au format JSON suivant, sans texte avant ni après, sans blocs de code markdown :",
    "",
    "{",
    '  "paragraphs": [',
    '    { "title": "Contexte de marché actuel", "body": "..." },',
    '    { "title": "Pourquoi ce produit convient à votre profil", "body": "..." },',
    '    { "title": "Scénarios et risques principaux", "body": "..." },',
    '    { "title": "Suivi recommandé", "body": "..." }',
    "  ]",
    "}",
    "",
    "Chaque paragraphe doit faire 3 à 5 phrases. Le ton doit être : " + TONE_LABEL[ctx.tone],
  ].join('\n');
}

export function buildUserPrompt(ctx: CommentaryContext): string {
  const objectivesLine =
    ctx.objectives.length > 0
      ? ctx.objectives.join(', ')
      : 'non précisés';

  return [
    "Rédige un commentaire client pour le produit structuré suivant :",
    "",
    describeProduct(ctx.product),
    "",
    `Profil client : ${PROFILE_LABEL[ctx.clientProfile]}`,
    `Objectifs patrimoniaux : ${objectivesLine}`,
    "",
    "Structure le commentaire en 4 paragraphes exactement :",
    "1. Contexte de marché actuel (macro, taux, volatilité pertinente pour ce sous-jacent)",
    "2. Pourquoi ce produit convient au profil et aux objectifs du client",
    "3. Scénarios et risques principaux (barrière, perte en capital, défaut émetteur, liquidité)",
    "4. Suivi recommandé (dates d'observation, points de vigilance, réexamen périodique)",
    "",
    "Réponds UNIQUEMENT avec le JSON demandé.",
  ].join('\n');
}
