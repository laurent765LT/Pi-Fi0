import { MIF2_GUARDRAILS } from './guardrails';

/**
 * Aggregated view of a client portfolio passed to the AI for analysis.
 * Kept intentionally minimal: the model works from summary statistics,
 * never from raw PII.
 */
export interface PortfolioPosition {
  productName: string;
  isin: string;
  payoffType: string;
  issuerName: string;
  underlyingName: string;
  sri: number;
  barrierPct: number | null;
  couponPct: number | null;
  maturityDate: string;
  notional: number;
  currentValuePct?: number;
}

export interface PortfolioSummary {
  totalNotional: number;
  currency: string;
  positionCount: number;
  positions: PortfolioPosition[];
  averageSri?: number;
  issuerConcentration?: Record<string, number>;
  underlyingConcentration?: Record<string, number>;
  maturityBuckets?: {
    under1Y: number;
    oneToThreeY: number;
    overThreeY: number;
  };
}

export const PORTFOLIO_ANALYSIS_V1 = {
  version: '1.0.0',
  name: 'portfolio-analysis',
  systemPrompt: `Tu es un risk manager senior spécialisé dans les produits structurés. Tu analyses des portefeuilles constitués de produits structurés pour aider les CGP à comprendre leur profil de risque agrégé.

Structure ta réponse exactement en quatre sections, titrées en Markdown :

## 1. Diagnostic global
Diagnostic synthétique du portefeuille : SRI moyen, concentration émetteur, concentration sous-jacents, maturités.

## 2. Risques identifiés
Risques principaux : concentration, corrélation des sous-jacents, effet barrière, risque émetteur, risque de liquidité. Sois quantitatif.

## 3. Scénarios de marché
Trois scénarios (favorable / neutre / défavorable) avec impact estimatif sur la valorisation.

## 4. Pistes de diversification (pédagogiques)
Pistes GÉNÉRIQUES de diversification : classes d'actifs sous-représentées, profils de SRI manquants. Pas de recommandation produit spécifique.

${MIF2_GUARDRAILS}`,
  buildUserPrompt: (data: PortfolioSummary): string => {
    const lines: string[] = [];
    lines.push(
      `Analyse du portefeuille : ${data.positionCount} position(s), notionnel total ${data.totalNotional.toLocaleString('fr-FR')} ${data.currency}.`,
    );
    if (data.averageSri !== undefined) {
      lines.push(`SRI moyen pondéré : ${data.averageSri.toFixed(2)}/7.`);
    }
    if (data.issuerConcentration) {
      const top = Object.entries(data.issuerConcentration)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `${k} (${(v * 100).toFixed(1)}%)`)
        .join(', ');
      lines.push(`Concentration émetteurs : ${top}.`);
    }
    if (data.underlyingConcentration) {
      const top = Object.entries(data.underlyingConcentration)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `${k} (${(v * 100).toFixed(1)}%)`)
        .join(', ');
      lines.push(`Concentration sous-jacents : ${top}.`);
    }
    if (data.maturityBuckets) {
      lines.push(
        `Maturités : < 1 an ${(data.maturityBuckets.under1Y * 100).toFixed(0)}%, ` +
          `1-3 ans ${(data.maturityBuckets.oneToThreeY * 100).toFixed(0)}%, ` +
          `> 3 ans ${(data.maturityBuckets.overThreeY * 100).toFixed(0)}%.`,
      );
    }
    lines.push('');
    lines.push('Positions détaillées :');
    for (const p of data.positions.slice(0, 20)) {
      lines.push(
        `- ${p.productName} (${p.isin}) | ${p.payoffType} | Émetteur ${p.issuerName} | Sous-jacent ${p.underlyingName} | SRI ${p.sri}/7 | Barrière ${
          p.barrierPct !== null ? `${p.barrierPct}%` : 'N/A'
        } | Coupon ${p.couponPct !== null ? `${p.couponPct}% p.a.` : 'N/A'} | Notionnel ${p.notional.toLocaleString('fr-FR')} ${data.currency} | Maturité ${p.maturityDate}`,
      );
    }
    if (data.positions.length > 20) {
      lines.push(`... et ${data.positions.length - 20} autre(s) position(s).`);
    }
    return lines.join('\n');
  },
} as const;
