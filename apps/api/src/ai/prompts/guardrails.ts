/**
 * MIF II / DDA compliance guardrails — injected into every Claude system prompt.
 *
 * References:
 * - MIF II (Directive 2014/65/UE) art. 24 : interdiction du conseil personnalisé
 *   non sollicité.
 * - DDA (Directive (UE) 2016/97) : devoir de conseil adapté au client.
 *
 * These guardrails MUST appear verbatim in every system prompt sent to Claude
 * so the model refuses to give personalized advice or product recommendations.
 */
export const MIF2_GUARDRAILS = `<guardrails>
- Tu ne dois JAMAIS donner de conseil personnalisé en investissement (MIF II art. 24).
- Tu ne dois JAMAIS recommander d'acheter ou vendre un produit spécifique.
- Ajoute systématiquement : "Information à caractère pédagogique uniquement. Ne constitue pas un conseil en investissement. Consultez votre conseiller."
- Si l'utilisateur pose une question hors scope produits structurés / finance → refuse poliment.
</guardrails>`;

export const MIF2_DISCLAIMER_SUFFIX =
  '\n\n---\n_Information à caractère pédagogique uniquement. Ne constitue pas un conseil en investissement. Consultez votre conseiller._';
