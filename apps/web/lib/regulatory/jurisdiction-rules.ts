// ─── Jurisdiction rules ─────────────────────────────────────────────────────
//
// Central configuration for each market Strick'in supports. Keep this file
// free of any React/browser imports so it can be consumed by server
// components, document generators and the client UI alike.

import type { Product } from '@/components/products/product-card';
import type {
  Jurisdiction,
  JurisdictionConfig,
} from '@/stores/jurisdiction-store';

// Re-export the types for consumers importing from this module.
export type { Jurisdiction, JurisdictionConfig } from '@/stores/jurisdiction-store';

// ─── Configs ────────────────────────────────────────────────────────────────

export const JURISDICTION_CONFIGS: Record<Jurisdiction, JurisdictionConfig> = {
  FR: {
    code: 'FR',
    name: 'France',
    flag: '\u{1F1EB}\u{1F1F7}',
    regulator: 'AMF',
    regulatorFullName: 'Autorit\u00e9 des March\u00e9s Financiers',
    registryName: 'ORIAS',
    currency: 'EUR',
    requiredDocs: ['ORIAS', 'RCP', 'KYC', 'MIF2'],
    vatRate: 20,
    language: 'fr-FR',
  },
  LU: {
    code: 'LU',
    name: 'Luxembourg',
    flag: '\u{1F1F1}\u{1F1FA}',
    regulator: 'CSSF',
    regulatorFullName: 'Commission de Surveillance du Secteur Financier',
    registryName: 'Registre CSSF',
    currency: 'EUR',
    requiredDocs: ['CSSF License', 'RCP', 'KYC Lux', 'CSSF Circular 20/758'],
    vatRate: 17,
    language: 'fr-LU',
  },
  BE: {
    code: 'BE',
    name: 'Belgique',
    flag: '\u{1F1E7}\u{1F1EA}',
    regulator: 'FSMA',
    regulatorFullName: 'Financial Services and Markets Authority',
    registryName: 'Registre FSMA',
    currency: 'EUR',
    requiredDocs: ['FSMA', 'RCP', 'KYC BE'],
    vatRate: 21,
    language: 'fr-BE',
  },
  CH: {
    code: 'CH',
    name: 'Suisse',
    flag: '\u{1F1E8}\u{1F1ED}',
    regulator: 'FINMA',
    regulatorFullName:
      'Autorit\u00e9 f\u00e9d\u00e9rale de surveillance des march\u00e9s financiers',
    registryName: 'Registre FINMA',
    currency: 'CHF',
    requiredDocs: ['FINMA', 'RCP', 'KYC CH'],
    vatRate: 8.1,
    language: 'fr-CH',
  },
};

export const JURISDICTIONS: Jurisdiction[] = ['FR', 'LU', 'BE', 'CH'];

// ─── Available products per jurisdiction ────────────────────────────────────
//
// For now this is a simple mock filter. CH is the only non-EUR market, so we
// filter out EUR-only products. Luxembourg has the broadest availability as
// it is our priority market. Belgium excludes a few payoff types that are
// not yet passported. In a real deployment this would be powered by the
// product's regulatory passport / jurisdictional availability flags.

type JurisdictionRule = (p: Product) => boolean;

const DEFAULT_RULE: JurisdictionRule = () => true;

const JURISDICTION_RULES: Record<Jurisdiction, JurisdictionRule> = {
  // France: all EUR products available.
  FR: DEFAULT_RULE,
  // Luxembourg: priority market, full catalogue available.
  LU: DEFAULT_RULE,
  // Belgium: FSMA currently restricts non-capital-protected high-SRI products
  // to professional clients only. We expose the same catalogue here but flag
  // high-SRI non-protected products for extra warnings (handled in UI).
  BE: (p) => !(p.sri >= 6 && p.payoffType !== 'CAPITAL_PROTECTED'),
  // Switzerland: only products priced in CHF or with a CHF share-class. Mock:
  // keep Capital Protected + Barrier Notes which are the most commonly
  // distributed structures in CH.
  CH: (p) =>
    p.payoffType === 'CAPITAL_PROTECTED' ||
    p.payoffType === 'BARRIER_NOTE' ||
    p.payoffType === 'AUTOCALL_PHOENIX',
};

/**
 * Returns the subset of products available in the given jurisdiction,
 * according to a (mock) set of passport rules.
 */
export function getAvailableProducts(
  jurisdiction: Jurisdiction,
  allProducts: Product[],
): Product[] {
  const rule = JURISDICTION_RULES[jurisdiction] ?? DEFAULT_RULE;
  return allProducts.filter(rule);
}

// ─── Disclaimers ────────────────────────────────────────────────────────────

const DISCLAIMERS: Record<Jurisdiction, string[]> = {
  FR: [
    "Document produit dans le cadre de la directive MIF II et du r\u00e8glement PRIIPs.",
    "Sup\u00e9rieur r\u00e9gulateur : AMF \u2014 Autorit\u00e9 des March\u00e9s Financiers (www.amf-france.org).",
    "Les produits structur\u00e9s comportent un risque de perte en capital partiel ou total.",
    "Immatriculation au Registre unique des interm\u00e9diaires ORIAS \u2014 www.orias.fr.",
  ],
  LU: [
    "Document \u00e9tabli conform\u00e9ment \u00e0 la Circulaire CSSF 20/758 et aux exigences MIFID II.",
    "Sup\u00e9rieur r\u00e9gulateur : CSSF \u2014 Commission de Surveillance du Secteur Financier (www.cssf.lu).",
    "Les produits structur\u00e9s sont des instruments financiers complexes au sens de la directive 2014/65/UE.",
    "Licence CSSF d\u00e9livr\u00e9e au titre de la loi du 5 avril 1993 relative au secteur financier.",
  ],
  BE: [
    "Document \u00e9tabli conform\u00e9ment au r\u00e8glement FSMA et \u00e0 la directive MIFID II.",
    "Sup\u00e9rieur r\u00e9gulateur : FSMA \u2014 Autorit\u00e9 des services et march\u00e9s financiers (www.fsma.be).",
    "Instrument financier complexe. Perte en capital possible. Nous vous invitons \u00e0 consulter la fiche info PRIIPs.",
    "Inscription au Registre FSMA requise pour les interm\u00e9diaires en services d\u2019investissement.",
  ],
  CH: [
    "Document \u00e9tabli conform\u00e9ment \u00e0 la loi f\u00e9d\u00e9rale sur les services financiers (LSFin).",
    "Sup\u00e9rieur r\u00e9gulateur : FINMA \u2014 Autorit\u00e9 f\u00e9d\u00e9rale de surveillance des march\u00e9s financiers (www.finma.ch).",
    "Produit financier au sens de la LSFin. La feuille d\u2019information de base (FIB) doit \u00eatre remise au client.",
    "Montants libell\u00e9s en CHF. Risque de perte en capital.",
  ],
};

export function getJurisdictionDisclaimers(
  jurisdiction: Jurisdiction,
): string[] {
  return DISCLAIMERS[jurisdiction] ?? DISCLAIMERS.FR;
}

// ─── Per-jurisdiction regulatory labels for generators ──────────────────────
//
// These helpers centralise the translation work that was previously hard-
// coded in `document-generator.ts` as FR-only strings. The generators now
// read from these tables to produce jurisdiction-appropriate documents
// while keeping FR output byte-identical.

export interface JurisdictionLegalLabels {
  /** Short name ("Lettre de mission", "Mandat de conseil", ...). */
  lettreMissionTitle: string;
  /** Regulator contact block used on the DER. */
  regulatorAddress: string;
  /** Reference registry sentence (shown on the DER). */
  registrySentence: string;
  /** Legal footer used at the bottom of the DER / report. */
  regulatoryFooter: string;
  /** BCP-47 locale used for Intl.NumberFormat / toLocaleDateString. */
  intlLocale: string;
}

export const JURISDICTION_LEGAL_LABELS: Record<
  Jurisdiction,
  JurisdictionLegalLabels
> = {
  FR: {
    lettreMissionTitle: 'Lettre de mission',
    regulatorAddress:
      'AMF \u2014 17 place de la Bourse, 75082 Paris Cedex 02 \u00b7 www.amf-france.org',
    registrySentence:
      'Immatriculation au Registre unique des interm\u00e9diaires ORIAS (v\u00e9rifiable sur www.orias.fr).',
    regulatoryFooter:
      'Document \u00e9mis dans le cadre de la directive 2014/65/UE (MIF II) et du r\u00e8glement PRIIPs.',
    intlLocale: 'fr-FR',
  },
  LU: {
    lettreMissionTitle: 'Mandat de conseil',
    regulatorAddress:
      'CSSF \u2014 283 route d\u2019Arlon, L-2991 Luxembourg \u00b7 www.cssf.lu',
    registrySentence:
      'Inscription au Registre public de la CSSF (v\u00e9rifiable sur www.cssf.lu).',
    regulatoryFooter:
      'Document \u00e9mis conform\u00e9ment \u00e0 la Circulaire CSSF 20/758 et \u00e0 la directive 2014/65/UE (MIF II).',
    intlLocale: 'fr-LU',
  },
  BE: {
    lettreMissionTitle: 'Lettre de mission',
    regulatorAddress:
      'FSMA \u2014 Rue du Congr\u00e8s 12-14, 1000 Bruxelles \u00b7 www.fsma.be',
    registrySentence:
      'Inscription au Registre FSMA des interm\u00e9diaires (v\u00e9rifiable sur www.fsma.be).',
    regulatoryFooter:
      'Document \u00e9mis dans le cadre du r\u00e8glement FSMA et de la directive 2014/65/UE (MIF II).',
    intlLocale: 'fr-BE',
  },
  CH: {
    lettreMissionTitle: 'Convention de conseil en placement',
    regulatorAddress:
      'FINMA \u2014 Laupenstrasse 27, 3003 Berne \u00b7 www.finma.ch',
    registrySentence:
      'Enregistrement au Registre FINMA des conseillers (v\u00e9rifiable sur www.finma.ch).',
    regulatoryFooter:
      'Document \u00e9mis conform\u00e9ment \u00e0 la loi f\u00e9d\u00e9rale sur les services financiers (LSFin).',
    intlLocale: 'fr-CH',
  },
};

export function getJurisdictionLegalLabels(
  jurisdiction: Jurisdiction,
): JurisdictionLegalLabels {
  return JURISDICTION_LEGAL_LABELS[jurisdiction] ?? JURISDICTION_LEGAL_LABELS.FR;
}

// ─── Pretty helpers (used by UI components) ─────────────────────────────────

/** "🇱🇺 Luxembourg (CSSF)" style label. */
export function formatJurisdictionBadgeLabel(
  jurisdiction: Jurisdiction,
): string {
  const cfg = JURISDICTION_CONFIGS[jurisdiction];
  return `${cfg.flag} ${cfg.name} (${cfg.regulator})`;
}
