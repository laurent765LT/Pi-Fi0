// ─── Regulatory document generator ──────────────────────────────────────────
// Generates print-ready HTML for the 3 regulatory PDFs required when a CGP
// onboards a new client on Strick'in:
//   1. Lettre de mission   — CIF/IOBSP engagement letter
//   2. DER                 — Document d'Entrée en Relation
//   3. Rapport d'adéquation — MIF II suitability report
//
// The HTML is opened in new browser windows; the user then uses the native
// "Print → Save as PDF" workflow (same pattern as lib/portfolio-pdf.ts).

import type {
  ClientDossier,
  ClientObjective,
  InvestmentHorizon,
  LossTolerance,
  MarketKnowledge,
  ProductExperience,
} from '@/stores/clients-store';
import {
  FAMILY_SITUATION_LABELS,
  INVESTMENT_HORIZON_LABELS,
  LOSS_TOLERANCE_LABELS,
  MARKET_KNOWLEDGE_LABELS,
  OBJECTIVE_LABELS,
  PRODUCT_EXPERIENCE_LABELS,
} from '@/stores/clients-store';
import type { Jurisdiction } from '@/stores/jurisdiction-store';
import {
  JURISDICTION_CONFIGS,
  getJurisdictionLegalLabels,
} from '@/lib/regulatory/jurisdiction-rules';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CGPInfo {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  oriasNumber: string;
  cifAssociation: string;
  iobspCategory: string;
  coaStatus: string;
  rcpNumber: string;
  rcpInsurer: string;
  financialGuarantee: string;
  signatureCity: string;
}

export interface GeneratorProduct {
  id: string;
  isin?: string;
  name?: string;
  payoffType?: string;
  sri?: number | null;
  maturityDate?: string | null;
  underlyingName?: string | null;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_CGP_INFO: CGPInfo = {
  fullName: 'Jean Dupont',
  company: "Strick'in Conseil \u2014 Cabinet de gestion de patrimoine",
  email: 'contact@strickin.com',
  phone: '+33 1 23 45 67 89',
  address: '12 rue de la Bourse, 75002 Paris',
  oriasNumber: '24 000 001',
  cifAssociation: 'CNCGP',
  iobspCategory: 'Cat\u00e9gorie B',
  coaStatus: 'Immatricul\u00e9',
  rcpNumber: 'RCP-2026-0001',
  rcpInsurer: 'MMA IARD SA',
  financialGuarantee: 'Garantie financi\u00e8re \u2014 CGPA',
  signatureCity: 'Paris',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Prot\u00e9g\u00e9',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
  AUTRE: 'Autre',
};

const PAYOFF_CLASSES: Record<string, string> = {
  AUTOCALL_PHOENIX: 'phoenix',
  AUTOCALL_COUPON: 'coupon',
  CAPITAL_PROTECTED: 'protected',
  CONDITIONAL_RATE: 'rate',
  BARRIER_NOTE: 'barrier',
  AUTRE: 'autre',
};

function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '\u2014';
  }
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '\u2014';
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function fullName(d: ClientDossier): string {
  return `${d.firstName} ${d.lastName}`.trim() || 'Client Strick\u2019in';
}

/**
 * Lightweight mustache-style interpolation.
 * Replaces every `{{key}}` with the corresponding value in `data`.
 * Values are NOT escaped automatically — the generator callers are
 * responsible for pre-escaping user-supplied strings with `escapeHtml`.
 */
function renderTemplate(
  template: string,
  data: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return key in data ? data[key] : '';
  });
}

// ─── Adequacy scoring ───────────────────────────────────────────────────────

type AdequacyStatus = 'ok' | 'warn' | 'bad';

const STATUS_LABEL: Record<AdequacyStatus, string> = {
  ok: 'Ad\u00e9quat',
  warn: '\u00c0 surveiller',
  bad: 'Insuffisant',
};

const STATUS_CLASS: Record<AdequacyStatus, string> = {
  ok: 'adequacy-ok',
  warn: 'adequacy-warn',
  bad: 'adequacy-bad',
};

function assessKnowledge(k: MarketKnowledge, e: ProductExperience): AdequacyStatus {
  if (k === 'expert' || k === 'averti') return 'ok';
  if (k === 'informe' && (e === '1a3ans' || e === '3a5ans' || e === 'plus5ans')) return 'ok';
  if (k === 'informe') return 'warn';
  return 'bad';
}

function assessFinance(revenues: number): AdequacyStatus {
  if (revenues >= 80_000) return 'ok';
  if (revenues >= 40_000) return 'warn';
  return 'bad';
}

function assessLoss(l: LossTolerance): AdequacyStatus {
  if (l >= 30) return 'ok';
  if (l === 10) return 'warn';
  return 'bad';
}

function assessHorizon(h: InvestmentHorizon): AdequacyStatus {
  if (h === 'plus8ans' || h === '5a8ans') return 'ok';
  if (h === '3a5ans') return 'warn';
  return 'bad';
}

function assessObjectives(objs: ClientObjective[]): AdequacyStatus {
  if (objs.length === 0) return 'bad';
  if (objs.length >= 2) return 'ok';
  return 'warn';
}

function worstStatus(statuses: AdequacyStatus[]): AdequacyStatus {
  if (statuses.includes('bad')) return 'bad';
  if (statuses.includes('warn')) return 'warn';
  return 'ok';
}

// ─── HTML templates (embedded) ──────────────────────────────────────────────
//
// We embed the templates as TypeScript constants so that they ship with the
// client bundle (Next.js does not let us read `.html` files from `templates/`
// at runtime from the browser). The same markup is mirrored in
// `templates/regulatory/*.html` for reference and non-runtime use.

const LETTRE_MISSION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Lettre de mission \u2014 {{clientFullName}}</title>
<style>
  @page { size: A4; margin: 1.8cm 2cm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A0A3E; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 11px; line-height: 1.55; }
  h1, h2, h3 { margin: 0; font-weight: 700; color: #1A0A3E; }
  h1 { font-size: 24px; letter-spacing: -0.3px; color: #fff; }
  h2 { font-size: 14px; margin-top: 22px; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1.5px solid #E6E2F3; display: flex; align-items: center; gap: 8px; }
  h2::before { content: ''; width: 3px; height: 14px; background: linear-gradient(180deg, #3B1FA8, #5B3FD4); border-radius: 2px; }
  p { margin: 0 0 8px; }
  ul { margin: 4px 0 8px 18px; padding: 0; } li { margin-bottom: 3px; }
  .header-brand { background: linear-gradient(135deg, #3B1FA8 0%, #5535C4 60%, #7B5FDC 100%); color: #fff; padding: 26px 30px 22px; border-radius: 16px; position: relative; overflow: hidden; margin-bottom: 18px; }
  .header-brand::before { content: ''; position: absolute; top: -50%; right: -10%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(212,160,23,0.22), transparent 60%); border-radius: 50%; }
  .header-brand::after { content: ''; position: absolute; bottom: -40%; left: -10%; width: 240px; height: 240px; background: radial-gradient(circle, rgba(0,184,148,0.18), transparent 60%); border-radius: 50%; }
  .brand-mark { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; margin-bottom: 14px; }
  .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4A017; }
  .brand-accent { color: #D4A017; }
  .header-title, .header-subtitle { position: relative; z-index: 1; }
  .header-subtitle { font-size: 12px; color: rgba(255,255,255,0.82); margin-top: 6px; }
  .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .party-card { background: #F8F6FF; border: 1px solid #E6E2F3; border-radius: 10px; padding: 12px 14px; }
  .party-card .role { font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; color: #7B6FA0; margin-bottom: 6px; }
  .party-card .name { font-size: 13px; font-weight: 700; color: #1A0A3E; }
  .party-card .detail { font-size: 10.5px; color: #3D2C6E; margin-top: 3px; }
  .info-table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
  .info-table td { padding: 6px 8px; border-bottom: 1px solid #F0EEF8; font-size: 10.5px; color: #3D2C6E; vertical-align: top; }
  .info-table td.label { width: 40%; font-weight: 600; color: #7B6FA0; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; }
  .obligations-box { background: #F8F6FF; border-left: 3px solid #3B1FA8; border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 8px 0 12px; }
  .obligations-box strong { color: #3B1FA8; font-size: 10.5px; }
  .legal-note { background: #FFF8E7; border: 1px solid #F0D98A; border-radius: 6px; padding: 9px 12px; font-size: 9.5px; color: #9B7210; line-height: 1.5; margin-top: 10px; }
  .legal-note strong { color: #7A5A08; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; page-break-inside: avoid; }
  .sign-block { border-top: 1.5px solid #3D2C6E; padding-top: 12px; min-height: 110px; }
  .sign-block .role-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #3D2C6E; margin-bottom: 4px; }
  .sign-block .name { font-size: 11.5px; font-weight: 600; color: #1A0A3E; }
  .sign-block .location { font-size: 9.5px; color: #7B6FA0; margin-top: 2px; font-style: italic; }
  .print-toolbar { position: fixed; top: 16px; right: 16px; z-index: 100; display: flex; gap: 8px; }
  .print-toolbar button { font-family: inherit; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 0; cursor: pointer; color: #fff; background: linear-gradient(135deg, #3B1FA8, #5B3FD4); box-shadow: 0 6px 18px rgba(59,31,168,0.3); }
  .print-toolbar button.secondary { background: #fff; color: #3D2C6E; border: 1px solid #E6E2F3; box-shadow: 0 2px 8px rgba(26,10,62,0.08); }
  @page { @bottom-left { content: "Strick'in \u2014 Lettre de mission confidentielle"; font-size: 8.5px; color: #7B6FA0; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font-size: 8.5px; color: #7B6FA0; } }
  @media print { .print-toolbar { display: none !important; } body { font-size: 10.5px; } .header-brand { margin-bottom: 14px; } }
</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" class="secondary" onclick="window.close();">Fermer</button>
    <button type="button" onclick="window.print();">Imprimer / Enregistrer en PDF</button>
  </div>
  <header class="header-brand">
    <div class="brand-mark"><span class="brand-dot"></span>Strick<span class="brand-accent">'</span>in</div>
    <div class="header-title"><h1>Lettre de mission</h1><p class="header-subtitle">Conseil en investissement financier (CIF) &amp; courtage en op\u00e9rations de banque et services de paiement (IOBSP)</p></div>
  </header>
  <p>La pr\u00e9sente lettre de mission est \u00e9tablie le <strong>{{currentDate}}</strong> entre les parties suivantes afin de d\u00e9finir les termes, le p\u00e9rim\u00e8tre et les modalit\u00e9s de la mission de conseil.</p>
  <div class="parties-grid">
    <div class="party-card">
      <div class="role">Le Conseiller (CGP)</div>
      <div class="name">{{cgpFullName}}</div>
      <div class="detail">{{cgpCompany}}</div>
      <div class="detail">{{cgpAddress}}</div>
      <div class="detail">ORIAS n\u00b0 {{cgpOriasNumber}}</div>
      <div class="detail">{{cgpEmail}} \u00b7 {{cgpPhone}}</div>
    </div>
    <div class="party-card">
      <div class="role">Le Client</div>
      <div class="name">{{clientFullName}}</div>
      <div class="detail">N\u00e9(e) le {{clientBirthDate}}</div>
      <div class="detail">Situation : {{clientFamilySituation}}</div>
      <div class="detail">Profession : {{clientProfession}}</div>
    </div>
  </div>
  <h2>Article 1 \u2014 Objet de la mission</h2>
  <p>Le Conseiller s\u2019engage \u00e0 fournir au Client un conseil en investissement financier personnalis\u00e9, portant notamment sur la souscription de produits structur\u00e9s r\u00e9f\u00e9renc\u00e9s par l\u2019interm\u00e9diaire de la plateforme Strick\u2019in. Cette mission couvre :</p>
  <ul>
    <li>L\u2019analyse de la situation personnelle, financi\u00e8re et patrimoniale du Client.</li>
    <li>L\u2019\u00e9valuation du profil d\u2019investisseur conform\u00e9ment \u00e0 la directive MIF II.</li>
    <li>La formulation de recommandations personnalis\u00e9es et \u00e9crites.</li>
    <li>Le suivi des investissements r\u00e9alis\u00e9s et le reporting p\u00e9riodique.</li>
  </ul>
  <h2>Article 2 \u2014 Statuts et immatriculations du Conseiller</h2>
  <div class="obligations-box"><strong>Obligations r\u00e9glementaires CIF / IOBSP</strong><br />Le Conseiller est immatricul\u00e9 au Registre Unique des Interm\u00e9diaires en Assurance, Banque et Finance (ORIAS) sous le num\u00e9ro <strong>{{cgpOriasNumber}}</strong> en qualit\u00e9 de :</div>
  <table class="info-table">
    <tr><td class="label">Conseiller en Investissement Financier (CIF)</td><td>Adh\u00e9rent de l\u2019association <strong>{{cgpCifAssociation}}</strong>, agr\u00e9\u00e9e par l\u2019AMF.</td></tr>
    <tr><td class="label">Courtier en Op\u00e9rations de Banque et Services de Paiement (IOBSP)</td><td>Sous le contr\u00f4le de l\u2019ACPR.</td></tr>
    <tr><td class="label">Responsabilit\u00e9 Civile Professionnelle</td><td>Police n\u00b0 {{cgpRcpNumber}} aupr\u00e8s de {{cgpRcpInsurer}}.</td></tr>
  </table>
  <h2>Article 3 \u2014 Obligations d\u2019information et de conseil</h2>
  <p>Conform\u00e9ment aux articles L.541-8-1 et suivants du Code mon\u00e9taire et financier et aux exigences de la directive 2014/65/UE (MIF II), le Conseiller s\u2019engage \u00e0 :</p>
  <ul>
    <li>Remettre pr\u00e9alablement le Document d\u2019Entr\u00e9e en Relation (DER).</li>
    <li>Recueillir les informations n\u00e9cessaires \u00e0 l\u2019\u00e9valuation du caract\u00e8re ad\u00e9quat de tout investissement.</li>
    <li>Formuler chaque recommandation de mani\u00e8re claire, non trompeuse et motiv\u00e9e.</li>
    <li>Remettre le Document d\u2019Informations Cl\u00e9s (DIC / KID) pr\u00e9vu par le r\u00e8glement PRIIPs.</li>
    <li>Pr\u00e9venir, g\u00e9rer et r\u00e9v\u00e9ler les conflits d\u2019int\u00e9r\u00eats.</li>
  </ul>
  <h2>Article 4 \u2014 R\u00e9mun\u00e9ration</h2>
  <p>Le Conseiller per\u00e7oit une r\u00e9tro-commission vers\u00e9e par le producteur du produit souscrit. Aucune facturation d\u2019honoraires n\u2019est mise \u00e0 la charge du Client au titre de la pr\u00e9sente mission, sauf convention particuli\u00e8re. Le d\u00e9tail des r\u00e9mun\u00e9rations per\u00e7ues est communiqu\u00e9 sur demande et rappel\u00e9 avant toute souscription.</p>
  <h2>Article 5 \u2014 Protection des donn\u00e9es personnelles</h2>
  <p>Les donn\u00e9es personnelles collect\u00e9es dans le cadre de la mission sont trait\u00e9es conform\u00e9ment au RGPD (UE 2016/679) et \u00e0 la loi \u201cInformatique et Libert\u00e9s\u201d modifi\u00e9e. Le Client dispose d\u2019un droit d\u2019acc\u00e8s, de rectification, d\u2019effacement, de limitation, de portabilit\u00e9 et d\u2019opposition \u00e0 l\u2019adresse {{cgpEmail}}.</p>
  <h2>Article 6 \u2014 M\u00e9diation et r\u00e9clamations</h2>
  <p>Toute r\u00e9clamation doit \u00eatre adress\u00e9e en premier lieu au Conseiller. \u00c0 d\u00e9faut de r\u00e9ponse satisfaisante dans un d\u00e9lai de deux mois, le Client peut saisir :</p>
  <ul>
    <li>Le M\u00e9diateur de l\u2019AMF \u2014 17 place de la Bourse, 75082 Paris Cedex 02.</li>
    <li>Le M\u00e9diateur de l\u2019ACPR \u2014 61 rue Taitbout, 75436 Paris Cedex 09.</li>
  </ul>
  <h2>Article 7 \u2014 Dur\u00e9e et r\u00e9siliation</h2>
  <p>La mission est conclue pour une dur\u00e9e ind\u00e9termin\u00e9e \u00e0 compter de sa signature. Chaque partie peut y mettre fin \u00e0 tout moment par lettre recommand\u00e9e avec accus\u00e9 de r\u00e9ception, sans pr\u00e9avis ni indemnit\u00e9.</p>
  <div class="legal-note"><strong>Avertissement.</strong> Les produits structur\u00e9s sont des instruments financiers complexes pouvant entra\u00eener une perte en capital partielle ou totale. Les performances pass\u00e9es ne pr\u00e9jugent pas des performances futures. Le Client reconna\u00eet avoir pris connaissance des risques avant toute d\u00e9cision d\u2019investissement.</div>
  <div class="signatures">
    <div class="sign-block">
      <div class="role-label">Le Conseiller</div>
      <div class="name">{{cgpFullName}}</div>
      <div class="location">Fait \u00e0 {{signatureCity}}, le {{currentDate}}</div>
    </div>
    <div class="sign-block">
      <div class="role-label">Le Client</div>
      <div class="name">{{clientFullName}}</div>
      <div class="location">Signature pr\u00e9c\u00e9d\u00e9e de la mention \u00ab lu et approuv\u00e9 \u00bb</div>
    </div>
  </div>
</body>
</html>`;

const DER_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Document d'Entr\u00e9e en Relation \u2014 {{clientFullName}}</title>
<style>
  @page { size: A4; margin: 1.8cm 2cm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A0A3E; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 11px; line-height: 1.55; }
  h1, h2, h3 { margin: 0; font-weight: 700; color: #1A0A3E; }
  h1 { font-size: 22px; color: #fff; }
  h2 { font-size: 13.5px; margin-top: 20px; margin-bottom: 7px; padding-bottom: 5px; border-bottom: 1.5px solid #E6E2F3; display: flex; align-items: center; gap: 8px; }
  h2::before { content: ''; width: 3px; height: 14px; background: linear-gradient(180deg, #3B1FA8, #5B3FD4); border-radius: 2px; }
  p { margin: 0 0 6px; }
  ul { margin: 4px 0 8px 18px; padding: 0; } li { margin-bottom: 3px; }
  .header-brand { background: linear-gradient(135deg, #3B1FA8 0%, #5535C4 60%, #7B5FDC 100%); color: #fff; padding: 24px 28px 20px; border-radius: 16px; position: relative; overflow: hidden; margin-bottom: 14px; }
  .header-brand::before { content: ''; position: absolute; top: -50%; right: -10%; width: 260px; height: 260px; background: radial-gradient(circle, rgba(212,160,23,0.22), transparent 60%); border-radius: 50%; }
  .brand-mark { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 16px; margin-bottom: 12px; }
  .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4A017; }
  .brand-accent { color: #D4A017; }
  .header-title, .header-subtitle { position: relative; z-index: 1; }
  .header-subtitle { font-size: 12px; color: rgba(255,255,255,0.82); margin-top: 6px; }
  .identity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; margin-bottom: 6px; }
  .identity-card { background: #F8F6FF; border: 1px solid #E6E2F3; border-radius: 10px; padding: 10px 12px; }
  .identity-card .key { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; color: #7B6FA0; margin-bottom: 4px; }
  .identity-card .val { font-size: 11px; font-weight: 600; color: #1A0A3E; }
  .info-table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; }
  .info-table td { padding: 5px 8px; border-bottom: 1px solid #F0EEF8; font-size: 10.5px; color: #3D2C6E; vertical-align: top; }
  .info-table td.label { width: 42%; font-weight: 600; color: #7B6FA0; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; }
  .orias-chip { display: inline-flex; align-items: center; gap: 6px; background: #EDE8FF; color: #3B1FA8; padding: 3px 10px; border-radius: 10px; font-weight: 700; font-size: 10px; }
  .reg-box { background: #F8F6FF; border-left: 3px solid #3B1FA8; border-radius: 0 8px 8px 0; padding: 9px 12px; margin: 6px 0 10px; font-size: 10.5px; }
  .authority-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 6px 0; }
  .authority-card { border: 1px solid #E6E2F3; border-radius: 8px; padding: 9px 11px; background: #fff; }
  .authority-card .title { font-weight: 700; color: #1A0A3E; font-size: 10.5px; margin-bottom: 2px; }
  .authority-card .addr { color: #7B6FA0; font-size: 9.5px; }
  .acknowledgement { border: 1.5px dashed #CCC8EA; border-radius: 10px; padding: 14px 16px; margin-top: 20px; background: #FAFAF8; }
  .acknowledgement strong { color: #3B1FA8; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; page-break-inside: avoid; }
  .sign-block { border-top: 1.5px solid #3D2C6E; padding-top: 10px; min-height: 100px; }
  .sign-block .role-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #3D2C6E; margin-bottom: 4px; }
  .sign-block .name { font-size: 11.5px; font-weight: 600; color: #1A0A3E; }
  .sign-block .location { font-size: 9.5px; color: #7B6FA0; margin-top: 2px; font-style: italic; }
  .print-toolbar { position: fixed; top: 16px; right: 16px; z-index: 100; display: flex; gap: 8px; }
  .print-toolbar button { font-family: inherit; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 0; cursor: pointer; color: #fff; background: linear-gradient(135deg, #3B1FA8, #5B3FD4); box-shadow: 0 6px 18px rgba(59,31,168,0.3); }
  .print-toolbar button.secondary { background: #fff; color: #3D2C6E; border: 1px solid #E6E2F3; box-shadow: 0 2px 8px rgba(26,10,62,0.08); }
  @page { @bottom-left { content: "Strick'in \u2014 DER confidentiel"; font-size: 8.5px; color: #7B6FA0; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font-size: 8.5px; color: #7B6FA0; } }
  @media print { .print-toolbar { display: none !important; } body { font-size: 10.5px; } }
</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" class="secondary" onclick="window.close();">Fermer</button>
    <button type="button" onclick="window.print();">Imprimer / Enregistrer en PDF</button>
  </div>
  <header class="header-brand">
    <div class="brand-mark"><span class="brand-dot"></span>Strick<span class="brand-accent">'</span>in</div>
    <div class="header-title"><h1>Document d\u2019Entr\u00e9e en Relation</h1><p class="header-subtitle">Information pr\u00e9alable pr\u00e9vue par les articles 325-3 et suivants du R\u00e8glement g\u00e9n\u00e9ral de l\u2019AMF et R.519-20 du Code mon\u00e9taire et financier</p></div>
  </header>
  <h2>1. Identification du cabinet</h2>
  <div class="identity-grid">
    <div class="identity-card"><div class="key">Raison sociale</div><div class="val">{{cgpCompany}}</div></div>
    <div class="identity-card"><div class="key">Conseiller r\u00e9f\u00e9rent</div><div class="val">{{cgpFullName}}</div></div>
    <div class="identity-card"><div class="key">Adresse professionnelle</div><div class="val">{{cgpAddress}}</div></div>
    <div class="identity-card"><div class="key">Contact</div><div class="val">{{cgpEmail}}<br />{{cgpPhone}}</div></div>
  </div>
  <p>Immatricul\u00e9 au Registre unique des interm\u00e9diaires ORIAS <span class="orias-chip">ORIAS n\u00b0 {{cgpOriasNumber}}</span> (v\u00e9rifiable sur <strong>www.orias.fr</strong>).</p>
  <h2>2. Statuts et activit\u00e9s r\u00e9glement\u00e9es</h2>
  <div class="reg-box">Le cabinet exerce les activit\u00e9s r\u00e9glement\u00e9es suivantes au titre de son immatriculation ORIAS :</div>
  <table class="info-table">
    <tr><td class="label">Conseiller en Investissement Financier (CIF)</td><td>Enregistr\u00e9 aupr\u00e8s de l\u2019association <strong>{{cgpCifAssociation}}</strong>, agr\u00e9\u00e9e par l\u2019AMF.</td></tr>
    <tr><td class="label">Courtier en Op\u00e9rations de Banque et Services de Paiement (IOBSP)</td><td>Cat\u00e9gorie {{cgpIobspCategory}}. Contr\u00f4le de l\u2019ACPR.</td></tr>
    <tr><td class="label">Courtier en assurance (COA)</td><td>{{cgpCoaStatus}}</td></tr>
    <tr><td class="label">Responsabilit\u00e9 Civile Professionnelle</td><td>Police n\u00b0 {{cgpRcpNumber}} \u2014 {{cgpRcpInsurer}}</td></tr>
    <tr><td class="label">Garantie financi\u00e8re</td><td>{{cgpFinancialGuarantee}}</td></tr>
  </table>
  <h2>3. Autorit\u00e9s de tutelle</h2>
  <div class="authority-grid">
    <div class="authority-card"><div class="title">AMF \u2014 Autorit\u00e9 des March\u00e9s Financiers</div><div class="addr">17 place de la Bourse, 75082 Paris Cedex 02<br />www.amf-france.org</div></div>
    <div class="authority-card"><div class="title">ACPR \u2014 Autorit\u00e9 de Contr\u00f4le Prudentiel et de R\u00e9solution</div><div class="addr">4 place de Budapest, 75436 Paris Cedex 09<br />acpr.banque-france.fr</div></div>
    <div class="authority-card"><div class="title">ORIAS \u2014 Registre des interm\u00e9diaires</div><div class="addr">1 rue Jules Lefebvre, 75311 Paris Cedex 09<br />www.orias.fr</div></div>
    <div class="authority-card"><div class="title">CNIL \u2014 Informatique et Libert\u00e9s</div><div class="addr">3 place de Fontenoy, 75007 Paris<br />www.cnil.fr</div></div>
  </div>
  <h2>4. Modes de r\u00e9mun\u00e9ration</h2>
  <p>Le cabinet per\u00e7oit principalement des commissions vers\u00e9es par les partenaires producteurs lors de la souscription ou du maintien d\u2019un contrat. Des honoraires de conseil peuvent \u00eatre factur\u00e9s sur devis pr\u00e9alable accept\u00e9 par le Client. Le d\u00e9tail des r\u00e9mun\u00e9rations per\u00e7ues au titre d\u2019une op\u00e9ration est communiqu\u00e9 au Client avant la souscription.</p>
  <h2>5. Conflits d\u2019int\u00e9r\u00eats</h2>
  <p>Le cabinet met en \u0153uvre une politique de pr\u00e9vention, d\u2019identification et de gestion des conflits d\u2019int\u00e9r\u00eats conforme aux articles 325-8 \u00e0 325-12 du RGAMF. Tout conflit d\u2019int\u00e9r\u00eat potentiel est r\u00e9v\u00e9l\u00e9 au Client avant la formulation de toute recommandation.</p>
  <h2>6. Traitement des r\u00e9clamations &amp; m\u00e9diation</h2>
  <p>Toute r\u00e9clamation doit \u00eatre formul\u00e9e par \u00e9crit \u00e0 l\u2019adresse du cabinet ou par courriel \u00e0 <strong>{{cgpEmail}}</strong>. Un accus\u00e9 de r\u00e9ception est adress\u00e9 sous 10 jours ouvr\u00e9s et une r\u00e9ponse apport\u00e9e dans un d\u00e9lai maximum de 2 mois. \u00c0 d\u00e9faut d\u2019accord, le Client peut saisir gratuitement :</p>
  <ul>
    <li><strong>M\u00e9diateur de l\u2019AMF</strong> \u2014 17 place de la Bourse, 75082 Paris Cedex 02.</li>
    <li><strong>M\u00e9diateur de l\u2019ACPR</strong> \u2014 61 rue Taitbout, 75436 Paris Cedex 09.</li>
    <li><strong>M\u00e9diation de la consommation</strong> \u2014 selon le secteur concern\u00e9.</li>
  </ul>
  <h2>7. Protection des donn\u00e9es personnelles (RGPD)</h2>
  <p>Le cabinet agit en qualit\u00e9 de responsable de traitement au sens du RGPD. Les donn\u00e9es collect\u00e9es sont n\u00e9cessaires \u00e0 l\u2019ex\u00e9cution de la mission de conseil, \u00e0 la LCB-FT et au respect des obligations r\u00e9glementaires. Elles sont conserv\u00e9es pour une dur\u00e9e maximale de 5 ans apr\u00e8s la fin de la relation commerciale. Le Client dispose d\u2019un droit d\u2019acc\u00e8s, de rectification, d\u2019effacement, de limitation, de portabilit\u00e9 et d\u2019opposition \u00e0 {{cgpEmail}}.</p>
  <h2>8. Client concern\u00e9</h2>
  <div class="identity-grid">
    <div class="identity-card"><div class="key">Nom / Pr\u00e9nom</div><div class="val">{{clientFullName}}</div></div>
    <div class="identity-card"><div class="key">Date de naissance</div><div class="val">{{clientBirthDate}}</div></div>
    <div class="identity-card"><div class="key">Situation familiale</div><div class="val">{{clientFamilySituation}}</div></div>
    <div class="identity-card"><div class="key">Profession</div><div class="val">{{clientProfession}}</div></div>
  </div>
  <div class="acknowledgement"><strong>Accus\u00e9 de r\u00e9ception.</strong> Le Client reconna\u00eet avoir re\u00e7u, lu et compris le pr\u00e9sent Document d\u2019Entr\u00e9e en Relation pr\u00e9alablement \u00e0 toute prestation de conseil. Il reconna\u00eet \u00e9galement avoir \u00e9t\u00e9 inform\u00e9 des statuts, des autorit\u00e9s de tutelle, des modes de r\u00e9mun\u00e9ration, de la proc\u00e9dure de r\u00e9clamation et de la politique de protection des donn\u00e9es du cabinet.</div>
  <div class="signatures">
    <div class="sign-block">
      <div class="role-label">Le Conseiller</div>
      <div class="name">{{cgpFullName}}</div>
      <div class="location">Fait \u00e0 {{signatureCity}}, le {{currentDate}}</div>
    </div>
    <div class="sign-block">
      <div class="role-label">Le Client</div>
      <div class="name">{{clientFullName}}</div>
      <div class="location">Signature pr\u00e9c\u00e9d\u00e9e de la mention \u00ab lu et approuv\u00e9 \u00bb</div>
    </div>
  </div>
</body>
</html>`;

const RAPPORT_ADEQUATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Rapport d'ad\u00e9quation \u2014 {{clientFullName}}</title>
<style>
  @page { size: A4; margin: 1.8cm 2cm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A0A3E; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 11px; line-height: 1.55; }
  h1, h2, h3 { margin: 0; font-weight: 700; color: #1A0A3E; }
  h1 { font-size: 24px; color: #fff; }
  h2 { font-size: 14px; margin-top: 22px; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1.5px solid #E6E2F3; display: flex; align-items: center; gap: 8px; }
  h2::before { content: ''; width: 3px; height: 14px; background: linear-gradient(180deg, #3B1FA8, #5B3FD4); border-radius: 2px; }
  h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #3D2C6E; margin-top: 16px; margin-bottom: 6px; }
  p { margin: 0 0 8px; }
  ul { margin: 4px 0 8px 18px; padding: 0; } li { margin-bottom: 3px; }
  .header-brand { background: linear-gradient(135deg, #3B1FA8 0%, #5535C4 60%, #7B5FDC 100%); color: #fff; padding: 26px 30px 22px; border-radius: 16px; position: relative; overflow: hidden; margin-bottom: 18px; }
  .header-brand::before { content: ''; position: absolute; top: -50%; right: -10%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(212,160,23,0.22), transparent 60%); border-radius: 50%; }
  .header-brand::after { content: ''; position: absolute; bottom: -40%; left: -10%; width: 240px; height: 240px; background: radial-gradient(circle, rgba(0,184,148,0.18), transparent 60%); border-radius: 50%; }
  .brand-mark { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; margin-bottom: 14px; }
  .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4A017; }
  .brand-accent { color: #D4A017; }
  .header-title, .header-subtitle { position: relative; z-index: 1; }
  .header-subtitle { font-size: 12px; color: rgba(255,255,255,0.82); margin-top: 6px; }
  .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; position: relative; z-index: 1; }
  .meta-card { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; padding: 10px 12px; }
  .meta-card .key { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; color: rgba(255,255,255,0.75); margin-bottom: 4px; }
  .meta-card .val { font-size: 11.5px; font-weight: 600; color: #fff; }
  .profile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .profile-card { border: 1px solid #E6E2F3; border-radius: 10px; padding: 11px 13px; background: #fff; }
  .profile-card .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; color: #7B6FA0; margin-bottom: 3px; }
  .profile-card .value { font-size: 12px; font-weight: 700; color: #1A0A3E; }
  .profile-card .sub { font-size: 9.5px; color: #7B6FA0; margin-top: 3px; }
  .objective-pill { display: inline-block; padding: 3px 10px; margin: 2px 4px 2px 0; border-radius: 10px; background: rgba(59,31,168,0.10); color: #3B1FA8; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; }
  table.products { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.products thead th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; color: #7B6FA0; padding: 8px 10px; background: #F8F6FF; border-bottom: 1.5px solid #E6E2F3; }
  table.products tbody td { padding: 8px 10px; border-bottom: 1px solid #E6E2F3; font-size: 10.5px; color: #3D2C6E; vertical-align: top; }
  table.products tbody tr:nth-child(even) td { background: #FBFAFF; }
  .prod-name { font-weight: 700; color: #1A0A3E; }
  .prod-isin { font-family: monospace; font-size: 9.5px; color: #7B6FA0; }
  .prod-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .prod-badge.phoenix { background: rgba(59,31,168,0.10); color: #3B1FA8; }
  .prod-badge.coupon { background: rgba(91,63,212,0.10); color: #5B3FD4; }
  .prod-badge.protected { background: rgba(0,184,148,0.12); color: #007A63; }
  .prod-badge.rate { background: rgba(212,160,23,0.15); color: #9B7210; }
  .prod-badge.barrier { background: rgba(232,51,74,0.12); color: #E8334A; }
  .prod-badge.autre { background: rgba(123,111,160,0.15); color: #7B6FA0; }
  .adequacy-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .adequacy-table th, .adequacy-table td { padding: 7px 10px; text-align: left; font-size: 10.5px; border-bottom: 1px solid #E6E2F3; }
  .adequacy-table th { background: #F8F6FF; font-weight: 700; color: #3D2C6E; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; }
  .adequacy-table td.status { font-weight: 700; text-align: center; }
  .adequacy-ok { color: #007A63; }
  .adequacy-warn { color: #9B7210; }
  .adequacy-bad { color: #E8334A; }
  .conclusion-box { background: linear-gradient(135deg, rgba(59,31,168,0.05) 0%, rgba(0,184,148,0.05) 100%); border: 1px solid #C9BCFF; border-radius: 10px; padding: 14px 16px; margin-top: 12px; }
  .conclusion-box strong { color: #3B1FA8; }
  .disclaimer { margin-top: 22px; padding: 12px 14px; border: 1px solid #E6E2F3; border-radius: 8px; background: #F8F6FF; font-size: 9.5px; color: #7B6FA0; line-height: 1.55; }
  .disclaimer strong { color: #3D2C6E; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 26px; page-break-inside: avoid; }
  .sign-block { border-top: 1.5px solid #3D2C6E; padding-top: 12px; min-height: 100px; }
  .sign-block .role-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #3D2C6E; margin-bottom: 4px; }
  .sign-block .name { font-size: 11.5px; font-weight: 600; color: #1A0A3E; }
  .sign-block .location { font-size: 9.5px; color: #7B6FA0; margin-top: 2px; font-style: italic; }
  .print-toolbar { position: fixed; top: 16px; right: 16px; z-index: 100; display: flex; gap: 8px; }
  .print-toolbar button { font-family: inherit; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 0; cursor: pointer; color: #fff; background: linear-gradient(135deg, #3B1FA8, #5B3FD4); box-shadow: 0 6px 18px rgba(59,31,168,0.3); }
  .print-toolbar button.secondary { background: #fff; color: #3D2C6E; border: 1px solid #E6E2F3; box-shadow: 0 2px 8px rgba(26,10,62,0.08); }
  @page { @bottom-left { content: "Strick'in \u2014 Rapport d'ad\u00e9quation MIF II"; font-size: 8.5px; color: #7B6FA0; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font-size: 8.5px; color: #7B6FA0; } }
  @media print { .print-toolbar { display: none !important; } body { font-size: 10.5px; } }
</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" class="secondary" onclick="window.close();">Fermer</button>
    <button type="button" onclick="window.print();">Imprimer / Enregistrer en PDF</button>
  </div>
  <header class="header-brand">
    <div class="brand-mark"><span class="brand-dot"></span>Strick<span class="brand-accent">'</span>in</div>
    <div class="header-title"><h1>Rapport d\u2019ad\u00e9quation MIF II</h1><p class="header-subtitle">\u00c9tabli conform\u00e9ment \u00e0 l\u2019article L.533-13 du Code mon\u00e9taire et financier et au R\u00e8glement d\u00e9l\u00e9gu\u00e9 (UE) 2017/565</p></div>
    <div class="meta-grid">
      <div class="meta-card"><div class="key">Client</div><div class="val">{{clientFullName}}</div></div>
      <div class="meta-card"><div class="key">Conseiller</div><div class="val">{{cgpFullName}}</div></div>
      <div class="meta-card"><div class="key">Date</div><div class="val">{{currentDate}}</div></div>
    </div>
  </header>
  <h2>1. Situation personnelle du Client</h2>
  <table class="adequacy-table">
    <tr><th style="width: 32%;">\u00c9l\u00e9ment</th><th>Valeur d\u00e9clar\u00e9e</th></tr>
    <tr><td>Nom et pr\u00e9nom</td><td>{{clientFullName}}</td></tr>
    <tr><td>Date de naissance</td><td>{{clientBirthDate}}</td></tr>
    <tr><td>Situation familiale</td><td>{{clientFamilySituation}}</td></tr>
    <tr><td>Profession</td><td>{{clientProfession}}</td></tr>
    <tr><td>Revenus annuels d\u00e9clar\u00e9s</td><td>{{clientRevenues}}</td></tr>
  </table>
  <h2>2. Profil d\u2019investisseur et capacit\u00e9 \u00e0 subir des pertes</h2>
  <div class="profile-grid">
    <div class="profile-card"><div class="label">Connaissance des march\u00e9s</div><div class="value">{{marketKnowledgeLabel}}</div><div class="sub">Auto-\u00e9valuation conforme \u00e0 l\u2019article 314-44 RGAMF</div></div>
    <div class="profile-card"><div class="label">Exp\u00e9rience produits structur\u00e9s</div><div class="value">{{productExperienceLabel}}</div><div class="sub">D\u00e9clar\u00e9e par le Client</div></div>
    <div class="profile-card"><div class="label">Capacit\u00e9 \u00e0 subir des pertes</div><div class="value">{{lossToleranceLabel}}</div><div class="sub">Tol\u00e9rance au risque maximale accept\u00e9e</div></div>
    <div class="profile-card"><div class="label">Horizon d\u2019investissement</div><div class="value">{{investmentHorizonLabel}}</div><div class="sub">Dur\u00e9e de d\u00e9tention envisag\u00e9e</div></div>
  </div>
  <h3>Objectifs patrimoniaux prioritaires</h3>
  <div>{{objectivesPills}}</div>
  <h2>3. Produits recommand\u00e9s</h2>
  <p>Les produits suivants ont \u00e9t\u00e9 s\u00e9lectionn\u00e9s par le Conseiller apr\u00e8s analyse du catalogue Strick\u2019in et mise en ad\u00e9quation avec le profil du Client :</p>
  <table class="products">
    <thead><tr><th>Produit</th><th>ISIN</th><th>Payoff</th><th>SRI</th><th>Maturit\u00e9</th></tr></thead>
    <tbody>{{productRows}}</tbody>
  </table>
  <h2>4. Analyse d\u2019ad\u00e9quation</h2>
  <table class="adequacy-table">
    <tr><th>Crit\u00e8re d\u2019ad\u00e9quation</th><th>\u00c9valuation</th><th style="width: 18%;">Statut</th></tr>
    <tr><td>Connaissance et exp\u00e9rience</td><td>{{knowledgeAdequacy}}</td><td class="status {{knowledgeStatusClass}}">{{knowledgeStatusLabel}}</td></tr>
    <tr><td>Situation financi\u00e8re (revenus, patrimoine)</td><td>{{financeAdequacy}}</td><td class="status {{financeStatusClass}}">{{financeStatusLabel}}</td></tr>
    <tr><td>Capacit\u00e9 \u00e0 subir des pertes</td><td>{{lossAdequacy}}</td><td class="status {{lossStatusClass}}">{{lossStatusLabel}}</td></tr>
    <tr><td>Horizon d\u2019investissement</td><td>{{horizonAdequacy}}</td><td class="status {{horizonStatusClass}}">{{horizonStatusLabel}}</td></tr>
    <tr><td>Objectifs d\u2019investissement</td><td>{{objectivesAdequacy}}</td><td class="status {{objectivesStatusClass}}">{{objectivesStatusLabel}}</td></tr>
  </table>
  <div class="conclusion-box"><strong>Conclusion du Conseiller.</strong> {{adequacyConclusion}}</div>
  <h2>5. Risques et avertissements sp\u00e9cifiques</h2>
  <ul>
    <li>Les produits structur\u00e9s sont des instruments financiers complexes au sens de la directive MIF II et peuvent entra\u00eener une <strong>perte en capital partielle ou totale</strong>.</li>
    <li>Le coupon ou la prime vers\u00e9 est conditionn\u00e9 \u00e0 la performance d\u2019un ou plusieurs sous-jacents et peut \u00eatre nul sur une p\u00e9riode donn\u00e9e.</li>
    <li>Le remboursement anticip\u00e9 automatique (autocall) peut intervenir \u00e0 tout moment et r\u00e9duire la dur\u00e9e effective de l\u2019investissement.</li>
    <li>Le Client est expos\u00e9 au <strong>risque \u00e9metteur</strong> et \u00e0 la liquidit\u00e9 du march\u00e9 secondaire.</li>
    <li>Les performances pass\u00e9es ne pr\u00e9jugent pas des performances futures.</li>
  </ul>
  <div class="disclaimer"><strong>Avertissement r\u00e9glementaire (MIF II \u00b7 PRIIPs).</strong> Le pr\u00e9sent rapport d\u2019ad\u00e9quation est \u00e9tabli \u00e0 partir des informations communiqu\u00e9es par le Client, sous sa seule responsabilit\u00e9 et d\u00e9clar\u00e9es sinc\u00e8res et compl\u00e8tes. Avant toute souscription, le Client doit avoir pris connaissance du Document d\u2019Informations Cl\u00e9s (DIC / KID) et du prospectus de chaque produit. Strick\u2019in n\u2019est pas l\u2019\u00e9metteur des produits pr\u00e9sent\u00e9s et ne garantit ni la performance ni le remboursement du capital investi.</div>
  <div class="signatures">
    <div class="sign-block">
      <div class="role-label">Le Conseiller</div>
      <div class="name">{{cgpFullName}}</div>
      <div class="location">Fait \u00e0 {{signatureCity}}, le {{currentDate}}</div>
    </div>
    <div class="sign-block">
      <div class="role-label">Le Client</div>
      <div class="name">{{clientFullName}}</div>
      <div class="location">Signature pr\u00e9c\u00e9d\u00e9e de la mention \u00ab lu et approuv\u00e9 \u00bb</div>
    </div>
  </div>
</body>
</html>`;

// ─── Shared data builder ────────────────────────────────────────────────────
//
// `jurisdiction` is optional and defaults to 'FR' so existing callers produce
// identical FR output. When a non-FR jurisdiction is supplied, a small set of
// regulatory labels (regulator name, registry, legal footer, etc.) is
// injected so downstream templates can render per-jurisdiction text.

function buildBaseData(
  dossier: ClientDossier,
  cgp: CGPInfo,
  jurisdiction: Jurisdiction = 'FR',
): Record<string, string> {
  const currentDate = formatDate(new Date().toISOString());
  const jCfg = JURISDICTION_CONFIGS[jurisdiction];
  const labels = getJurisdictionLegalLabels(jurisdiction);
  return {
    currentDate: escapeHtml(currentDate),
    signatureCity: escapeHtml(cgp.signatureCity),
    // CGP
    cgpFullName: escapeHtml(cgp.fullName),
    cgpCompany: escapeHtml(cgp.company),
    cgpAddress: escapeHtml(cgp.address),
    cgpEmail: escapeHtml(cgp.email),
    cgpPhone: escapeHtml(cgp.phone),
    cgpOriasNumber: escapeHtml(cgp.oriasNumber),
    cgpCifAssociation: escapeHtml(cgp.cifAssociation),
    cgpIobspCategory: escapeHtml(cgp.iobspCategory),
    cgpCoaStatus: escapeHtml(cgp.coaStatus),
    cgpRcpNumber: escapeHtml(cgp.rcpNumber),
    cgpRcpInsurer: escapeHtml(cgp.rcpInsurer),
    cgpFinancialGuarantee: escapeHtml(cgp.financialGuarantee),
    // Client
    clientFullName: escapeHtml(fullName(dossier)),
    clientBirthDate: escapeHtml(formatShortDate(dossier.birthDate)),
    clientFamilySituation: escapeHtml(
      FAMILY_SITUATION_LABELS[dossier.familySituation] ?? dossier.familySituation,
    ),
    clientProfession: escapeHtml(dossier.profession || '\u2014'),
    clientRevenues: escapeHtml(formatAmount(dossier.revenuesAnnuel)),
    // Jurisdiction (new in Phase 3.7 — keys are additive so FR output is unchanged)
    jurisdictionCode: escapeHtml(jCfg.code),
    jurisdictionName: escapeHtml(jCfg.name),
    jurisdictionFlag: jCfg.flag,
    jurisdictionRegulator: escapeHtml(jCfg.regulator),
    jurisdictionRegulatorFullName: escapeHtml(jCfg.regulatorFullName),
    jurisdictionRegistryName: escapeHtml(jCfg.registryName),
    jurisdictionCurrency: escapeHtml(jCfg.currency),
    jurisdictionLettreTitle: escapeHtml(labels.lettreMissionTitle),
    jurisdictionRegulatorAddress: escapeHtml(labels.regulatorAddress),
    jurisdictionRegistrySentence: escapeHtml(labels.registrySentence),
    jurisdictionRegulatoryFooter: escapeHtml(labels.regulatoryFooter),
  };
}

// ─── Public generators ──────────────────────────────────────────────────────

export function generateLettreMission(
  dossier: ClientDossier,
  cgp: CGPInfo = DEFAULT_CGP_INFO,
  jurisdiction: Jurisdiction = 'FR',
): string {
  return renderTemplate(LETTRE_MISSION_TEMPLATE, buildBaseData(dossier, cgp, jurisdiction));
}

export function generateDER(
  dossier: ClientDossier,
  cgp: CGPInfo = DEFAULT_CGP_INFO,
  jurisdiction: Jurisdiction = 'FR',
): string {
  return renderTemplate(DER_TEMPLATE, buildBaseData(dossier, cgp, jurisdiction));
}

export function generateRapportAdequation(
  dossier: ClientDossier,
  cgp: CGPInfo = DEFAULT_CGP_INFO,
  products: GeneratorProduct[] = [],
  jurisdiction: Jurisdiction = 'FR',
): string {
  const base = buildBaseData(dossier, cgp, jurisdiction);

  // Product table rows
  const productRows = products.length > 0
    ? products
        .map((p) => {
          const payoff = p.payoffType ?? 'AUTRE';
          const payoffClass = PAYOFF_CLASSES[payoff] ?? 'autre';
          const payoffLabel = PAYOFF_LABELS[payoff] ?? payoff;
          const sri = p.sri != null ? String(p.sri) : '\u2014';
          return `<tr>
            <td class="prod-name">${escapeHtml(p.name ?? '\u2014')}</td>
            <td class="prod-isin">${escapeHtml(p.isin ?? '\u2014')}</td>
            <td><span class="prod-badge ${payoffClass}">${escapeHtml(payoffLabel)}</span></td>
            <td>${escapeHtml(sri)} / 7</td>
            <td>${escapeHtml(formatShortDate(p.maturityDate))}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="5" style="text-align:center;color:#7B6FA0;font-style:italic;padding:14px 10px;">Aucun produit s\u00e9lectionn\u00e9.</td></tr>';

  // Objective pills
  const objectivesPills = dossier.objectives.length > 0
    ? dossier.objectives
        .map(
          (o) =>
            `<span class="objective-pill">${escapeHtml(OBJECTIVE_LABELS[o] ?? o)}</span>`,
        )
        .join('')
    : '<span style="color:#7B6FA0;font-style:italic;font-size:10.5px;">Aucun objectif renseign\u00e9.</span>';

  // Adequacy scoring
  const knowledgeStatus = assessKnowledge(
    dossier.marketKnowledge,
    dossier.productExperience,
  );
  const financeStatus = assessFinance(dossier.revenuesAnnuel);
  const lossStatus = assessLoss(dossier.lossTolerance);
  const horizonStatus = assessHorizon(dossier.investmentHorizon);
  const objectivesStatus = assessObjectives(dossier.objectives);

  const globalStatus = worstStatus([
    knowledgeStatus,
    financeStatus,
    lossStatus,
    horizonStatus,
    objectivesStatus,
  ]);

  const adequacyConclusion = (() => {
    switch (globalStatus) {
      case 'ok':
        return `Au vu des \u00e9l\u00e9ments communiqu\u00e9s, la s\u00e9lection de produits structur\u00e9s
            propos\u00e9e est consid\u00e9r\u00e9e comme ad\u00e9quate au profil, \u00e0 l\u2019horizon, \u00e0 la
            capacit\u00e9 \u00e0 subir des pertes et aux objectifs patrimoniaux du Client.`;
      case 'warn':
        return `Certains crit\u00e8res n\u00e9cessitent la vigilance du Client. Le Conseiller
            a attir\u00e9 son attention sur les points \u00e0 surveiller et recommande un
            suivi renforc\u00e9 de l\u2019investissement.`;
      case 'bad':
        return `Un ou plusieurs crit\u00e8res ne satisfont pas au caract\u00e8re ad\u00e9quat.
            Le Conseiller d\u00e9conseille la souscription en l\u2019\u00e9tat et proposera une
            alternative mieux adapt\u00e9e avant tout engagement du Client.`;
    }
  })();

  return renderTemplate(RAPPORT_ADEQUATION_TEMPLATE, {
    ...base,
    marketKnowledgeLabel: escapeHtml(MARKET_KNOWLEDGE_LABELS[dossier.marketKnowledge]),
    productExperienceLabel: escapeHtml(PRODUCT_EXPERIENCE_LABELS[dossier.productExperience]),
    lossToleranceLabel: escapeHtml(LOSS_TOLERANCE_LABELS[dossier.lossTolerance]),
    investmentHorizonLabel: escapeHtml(INVESTMENT_HORIZON_LABELS[dossier.investmentHorizon]),
    objectivesPills,
    productRows,
    knowledgeAdequacy:
      'Connaissance ' + escapeHtml(MARKET_KNOWLEDGE_LABELS[dossier.marketKnowledge].toLowerCase()) +
      ', exp\u00e9rience ' + escapeHtml(PRODUCT_EXPERIENCE_LABELS[dossier.productExperience].toLowerCase()) + '.',
    knowledgeStatusClass: STATUS_CLASS[knowledgeStatus],
    knowledgeStatusLabel: STATUS_LABEL[knowledgeStatus],
    financeAdequacy:
      'Revenus annuels d\u00e9clar\u00e9s : ' + escapeHtml(formatAmount(dossier.revenuesAnnuel)) + '.',
    financeStatusClass: STATUS_CLASS[financeStatus],
    financeStatusLabel: STATUS_LABEL[financeStatus],
    lossAdequacy:
      'Tol\u00e9rance : ' + escapeHtml(LOSS_TOLERANCE_LABELS[dossier.lossTolerance].toLowerCase()) + '.',
    lossStatusClass: STATUS_CLASS[lossStatus],
    lossStatusLabel: STATUS_LABEL[lossStatus],
    horizonAdequacy:
      'Horizon d\u00e9clar\u00e9 : ' + escapeHtml(INVESTMENT_HORIZON_LABELS[dossier.investmentHorizon].toLowerCase()) + '.',
    horizonStatusClass: STATUS_CLASS[horizonStatus],
    horizonStatusLabel: STATUS_LABEL[horizonStatus],
    objectivesAdequacy:
      dossier.objectives.length > 0
        ? dossier.objectives.length + ' objectif(s) patrimonial(aux) exprim\u00e9(s).'
        : 'Aucun objectif exprim\u00e9.',
    objectivesStatusClass: STATUS_CLASS[objectivesStatus],
    objectivesStatusLabel: STATUS_LABEL[objectivesStatus],
    adequacyConclusion,
  });
}

// ─── Opening helpers (browser) ──────────────────────────────────────────────

function openHtmlInNewWindow(html: string, title: string): Window | null {
  if (typeof window === 'undefined') return null;
  const win = window.open('', '_blank');
  if (!win) return null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  try {
    win.document.title = title;
  } catch {
    // ignore cross-document errors
  }
  return win;
}

export interface DownloadAllResult {
  opened: number;
  blocked: boolean;
}

/**
 * Opens the 3 regulatory documents in new browser tabs so the user can
 * print-to-PDF each one. If pop-ups are blocked we return `blocked: true`
 * and the caller should surface an error toast.
 *
 * The tabs are opened sequentially with a small stagger to avoid most
 * browsers' multi-popup heuristics blocking the 2nd and 3rd windows.
 */
export function downloadAllDocuments(
  dossier: ClientDossier,
  cgp: CGPInfo = DEFAULT_CGP_INFO,
  products: GeneratorProduct[] = [],
  jurisdiction: Jurisdiction = 'FR',
): DownloadAllResult {
  const name = fullName(dossier);
  const lettre = generateLettreMission(dossier, cgp, jurisdiction);
  const der = generateDER(dossier, cgp, jurisdiction);
  const rapport = generateRapportAdequation(dossier, cgp, products, jurisdiction);

  let opened = 0;

  const w1 = openHtmlInNewWindow(lettre, `Lettre de mission \u2014 ${name}`);
  if (w1) opened++;

  // Small delays help reduce popup-blocker false positives on Safari/Firefox.
  setTimeout(() => {
    const w2 = openHtmlInNewWindow(der, `DER \u2014 ${name}`);
    if (w2) opened++;
  }, 180);

  setTimeout(() => {
    const w3 = openHtmlInNewWindow(rapport, `Rapport d'ad\u00e9quation \u2014 ${name}`);
    if (w3) opened++;
  }, 360);

  return {
    opened,
    blocked: !w1,
  };
}

/**
 * Opens a single regulatory document in a new window.
 * Used from the detail page's three per-document download buttons.
 */
export function downloadSingleDocument(
  kind: 'lettre' | 'der' | 'rapport',
  dossier: ClientDossier,
  cgp: CGPInfo = DEFAULT_CGP_INFO,
  products: GeneratorProduct[] = [],
  jurisdiction: Jurisdiction = 'FR',
): boolean {
  const name = fullName(dossier);
  const labels = getJurisdictionLegalLabels(jurisdiction);
  let html: string;
  let title: string;
  switch (kind) {
    case 'lettre':
      html = generateLettreMission(dossier, cgp, jurisdiction);
      title = `${labels.lettreMissionTitle} \u2014 ${name}`;
      break;
    case 'der':
      html = generateDER(dossier, cgp, jurisdiction);
      title = `DER \u2014 ${name}`;
      break;
    case 'rapport':
      html = generateRapportAdequation(dossier, cgp, products, jurisdiction);
      title = `Rapport d'ad\u00e9quation \u2014 ${name}`;
      break;
  }
  const win = openHtmlInNewWindow(html, title);
  return win !== null;
}
