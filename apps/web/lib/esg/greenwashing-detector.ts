// ─── Greenwashing Detector ────────────────────────────────────────────────────
// Lightweight rule-based detection layered on top of the mocked ESG data.
// Returns the most important alert (if any) so a product can surface a single
// prominent banner rather than a wall of warnings.

import type { ESGData } from './sfdr-schema';

export type GreenwashingSeverity = 'warning' | 'critical';

export interface GreenwashingAlert {
  severity: GreenwashingSeverity;
  message: string;
  details: string;
  ruleId: string;
}

interface Rule {
  id: string;
  evaluate: (esg: ESGData) => GreenwashingAlert | null;
}

const RULES: Rule[] = [
  {
    id: 'art9-fossil-high',
    evaluate: (esg) => {
      if (esg.sfdr === 'art9' && esg.fossilFuelExposure > 10) {
        return {
          severity: 'critical',
          ruleId: 'art9-fossil-high',
          message: 'Incoh\u00e9rence SFDR Article 9 d\u00e9tect\u00e9e',
          details: `Ce produit est class\u00e9 Article 9 (objectif d'investissement durable) mais pr\u00e9sente une exposition aux \u00e9nergies fossiles de ${esg.fossilFuelExposure}%, au-dessus du seuil de 10% g\u00e9n\u00e9ralement consid\u00e9r\u00e9 comme acceptable. Cette divergence peut constituer un risque de greenwashing au sens de la r\u00e9glementation SFDR.`,
        };
      }
      return null;
    },
  },
  {
    id: 'art9-taxonomy-low',
    evaluate: (esg) => {
      if (esg.sfdr === 'art9' && esg.taxonomyAlignment < 50) {
        return {
          severity: 'warning',
          ruleId: 'art9-taxonomy-low',
          message: 'Alignement Taxonomie faible pour un Art. 9',
          details: `Avec un alignement Taxonomie de ${esg.taxonomyAlignment}%, ce produit est en de\u00e7\u00e0 du seuil de 50% couramment attendu pour une classification Article 9. Un contr\u00f4le de coh\u00e9rence de la strat\u00e9gie durable est recommand\u00e9.`,
        };
      }
      return null;
    },
  },
  {
    id: 'art8-no-exclusions',
    evaluate: (esg) => {
      if (esg.sfdr === 'art8' && esg.exclusions.length === 0) {
        return {
          severity: 'warning',
          ruleId: 'art8-no-exclusions',
          message: 'Aucune exclusion d\u00e9clar\u00e9e pour un produit Art. 8',
          details:
            "Ce produit promeut des caract\u00e9ristiques environnementales ou sociales (Article 8) mais aucune exclusion sectorielle n'est d\u00e9clar\u00e9e. Cela peut indiquer un engagement ESG incomplet ou une documentation manquante.",
        };
      }
      return null;
    },
  },
  {
    id: 'overall-env-gap',
    evaluate: (esg) => {
      if (esg.overallScore > 80 && esg.subScores.environment < 50) {
        return {
          severity: 'warning',
          ruleId: 'overall-env-gap',
          message: 'Score global \u00e9lev\u00e9 mais volet environnemental faible',
          details: `Le score ESG global (${esg.overallScore}/100) contraste avec une note environnementale de seulement ${esg.subScores.environment}/100. Cette asym\u00e9trie peut masquer une exposition \u00e0 des activit\u00e9s peu durables malgr\u00e9 de bons indicateurs sociaux ou de gouvernance.`,
        };
      }
      return null;
    },
  },
];

export function detectGreenwashing(esg: ESGData): GreenwashingAlert | null {
  // Return the first critical alert, else the first warning, else null.
  const hits: GreenwashingAlert[] = [];
  for (const rule of RULES) {
    const alert = rule.evaluate(esg);
    if (alert) hits.push(alert);
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
  return hits[0] ?? null;
}

// Useful for the assureur dashboard — returns every hit, not just the top one.
export function detectAllGreenwashing(esg: ESGData): GreenwashingAlert[] {
  const hits: GreenwashingAlert[] = [];
  for (const rule of RULES) {
    const alert = rule.evaluate(esg);
    if (alert) hits.push(alert);
  }
  hits.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
  return hits;
}
