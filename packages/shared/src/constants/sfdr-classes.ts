/**
 * SFDR classification metadata.
 */

import { SFDRClassification } from '../domain/esg';

export const SFDR_LABELS: Record<SFDRClassification, string> = {
  [SFDRClassification.ART_6]: 'Article 6',
  [SFDRClassification.ART_8]: 'Article 8 (Light Green)',
  [SFDRClassification.ART_9]: 'Article 9 (Dark Green)',
  [SFDRClassification.NON_ESG]: 'Non ESG',
};

export const SFDR_DESCRIPTIONS: Record<SFDRClassification, string> = {
  [SFDRClassification.ART_6]:
    "Produits ne promouvant pas de caractéristiques environnementales ou sociales.",
  [SFDRClassification.ART_8]:
    "Produits promouvant, entre autres, des caractéristiques environnementales ou sociales.",
  [SFDRClassification.ART_9]:
    "Produits ayant un objectif d'investissement durable.",
  [SFDRClassification.NON_ESG]:
    "Produits hors du périmètre SFDR.",
};

export const SFDR_COLORS: Record<SFDRClassification, string> = {
  [SFDRClassification.ART_6]: '#9E9E9E',
  [SFDRClassification.ART_8]: '#8BC34A',
  [SFDRClassification.ART_9]: '#2E7D32',
  [SFDRClassification.NON_ESG]: '#BDBDBD',
};
