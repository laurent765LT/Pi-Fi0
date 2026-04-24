/**
 * Regulatory references used for legal mentions, banners, KID footers.
 *
 * Keeping them centralised avoids copy-paste drift across screens.
 */

export const REGULATORY_REFERENCES = {
  MIF_II: {
    label: 'MIF II',
    fullName: "Directive 2014/65/UE — Marchés d'instruments financiers",
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0065',
  },
  DDA: {
    label: 'DDA',
    fullName: 'Directive (UE) 2016/97 sur la distribution d\'assurances',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016L0097',
  },
  PRIIPS: {
    label: 'PRIIPs',
    fullName:
      'Règlement (UE) n° 1286/2014 sur les produits d\'investissement packagés de détail et fondés sur l\'assurance',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014R1286',
  },
  SFDR: {
    label: 'SFDR',
    fullName:
      'Règlement (UE) 2019/2088 sur la publication d\'informations en matière de durabilité',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32019R2088',
  },
  RGPD: {
    label: 'RGPD',
    fullName: 'Règlement (UE) 2016/679 sur la protection des données',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016R0679',
  },
  DORA: {
    label: 'DORA',
    fullName: 'Règlement (UE) 2022/2554 sur la résilience opérationnelle numérique',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R2554',
  },
} as const;

export type RegulatoryKey = keyof typeof REGULATORY_REFERENCES;

/**
 * Minimum-length disclosures mandated by regulators for certain surfaces.
 * Kept in French (primary locale).
 */
export const REGULATORY_DISCLAIMERS = {
  SIMULATED_QUOTE:
    "DEVIS SIMULÉ — Cotation synthétique générée à des fins éducatives/analytiques. Ne constitue pas une offre ferme.",
  INVESTMENT_RISK:
    "Les produits structurés présentent un risque de perte en capital en cours de vie et à l'échéance. Les performances passées ne préjugent pas des performances futures.",
  PAST_PERFORMANCE:
    "Les performances passées ne sont pas un indicateur fiable des performances futures.",
} as const;
