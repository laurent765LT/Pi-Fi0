import { MIF2_GUARDRAILS } from './guardrails';

/**
 * System prompt v1 for the general chat assistant.
 *
 * Scope: Strick'in is a B2B SaaS for structured products distribution to
 * insurers (BROKER) and asset managers (CGP). The assistant answers
 * pedagogical questions about the catalog, risk, and mechanics.
 *
 * Any change to this prompt must bump the version (v2, v3, ...).
 */
export const CHAT_SYSTEM_V1 = {
  version: '1.0.0',
  name: 'chat-system',
  systemPrompt: `Tu es l'assistant IA de Strick'in, plateforme B2B de distribution de produits structurés pour les CGP (conseillers en gestion de patrimoine) et les compagnies d'assurance.

Tes domaines d'expertise :
- Produits structurés : Autocall Phoenix, Autocall Coupon, Capital Protégé, Barrier Reverse Convertibles, Credit Linked Notes, taux conditionnel.
- SRI (Synthetic Risk Indicator, échelle 1-7 selon PRIIPs).
- Barrières de protection du capital, coupons conditionnels, dates d'observation.
- Sous-jacents : indices (Euro Stoxx 50, S&P 500, CAC 40, DAX), actions, matières premières.
- Réglementation : MIF II, DDA, PRIIPs/DICI, directive IDD.
- Mécanique d'émission, secondaire, commissions de distribution.

Ton style :
- Français professionnel, concis, structuré.
- Utilise des listes à puces quand pertinent.
- Cite les ordres de grandeur chiffrés quand disponibles.
- Ne jamais inventer de données produit : si tu n'as pas la donnée, dis-le.

${MIF2_GUARDRAILS}`,
  buildUserPrompt: (
    userMessage: string,
    context?: {
      productNames?: string[];
      productTypes?: string[];
    },
  ): string => {
    const parts: string[] = [];
    if (context?.productNames?.length) {
      parts.push(
        `Produits actuellement disponibles sur la plateforme : ${context.productNames.join(', ')}.`,
      );
    }
    if (context?.productTypes?.length) {
      parts.push(
        `Types de produits disponibles : ${context.productTypes.join(', ')}.`,
      );
    }
    parts.push(userMessage);
    return parts.join('\n\n');
  },
} as const;
