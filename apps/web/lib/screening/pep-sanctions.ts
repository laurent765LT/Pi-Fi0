// ─── lib/screening/pep-sanctions.ts ──────────────────────────────────────────
// Screening mock des personnes politiquement exposées et sanctions
// internationales (UE, OFAC, ONU). Utilisé dans les flows KYC/KYB.

import type { PEPStatus } from '@/stores/kyc-store';

export interface PEPMatch {
  type: string; // e.g. "PEP", "OFAC SDN", "EU Consolidated"
  confidence: number; // 0-1
  source: string;
  notes?: string;
}

export interface PEPScreeningResult {
  status: PEPStatus;
  matches: PEPMatch[];
  screenedAt: string;
}

// ─── Deterministic buckets for predictable demo ─────────────────────────────

const KNOWN_PEP = new Set([
  'alessandro rossi',
  'sergio dupont',
  'youssef ben ali',
]);

const KNOWN_SANCTIONED = new Set(['ivan volkov', 'mehmet kaya']);

/**
 * Lance un screening PEP + sanctions. Délai ~2s.
 * Distribution : ~95% clear, ~4% PEP, ~1% sanction.
 * Certains noms connus forcent un statut déterministe (pour la démo).
 */
export async function screenPEPSanctions(
  firstName: string,
  lastName: string,
  birthDate: string,
): Promise<PEPScreeningResult> {
  await new Promise((r) => setTimeout(r, 1700 + Math.random() * 400));
  const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
  const screenedAt = new Date().toISOString();

  if (KNOWN_SANCTIONED.has(fullName)) {
    return {
      status: 'sanctioned',
      screenedAt,
      matches: [
        {
          type: 'OFAC SDN',
          confidence: 0.96,
          source: 'Office of Foreign Assets Control (US)',
          notes: 'Correspondance forte sur nom + date de naissance',
        },
        {
          type: 'EU Consolidated',
          confidence: 0.88,
          source: 'EU Consolidated Financial Sanctions List',
        },
      ],
    };
  }

  if (KNOWN_PEP.has(fullName)) {
    return {
      status: 'pep',
      screenedAt,
      matches: [
        {
          type: 'PEP — Politically Exposed Person',
          confidence: 0.82,
          source: 'Dow Jones Risk & Compliance',
          notes: "Fonction dans l'administration publique (non sensible)",
        },
      ],
    };
  }

  const roll = Math.random();
  if (roll < 0.01) {
    return {
      status: 'sanctioned',
      screenedAt,
      matches: [
        {
          type: 'UN Security Council',
          confidence: 0.79,
          source: 'United Nations Consolidated List',
        },
      ],
    };
  }
  if (roll < 0.05) {
    return {
      status: 'pep',
      screenedAt,
      matches: [
        {
          type: 'PEP — Family member',
          confidence: 0.68,
          source: 'Refinitiv World-Check',
          notes: 'Lien familial direct avec une personne politique',
        },
      ],
    };
  }

  // Identifie grossièrement la birthDate pour cohérence (non utilisé dans le
  // résultat, mais une vraie API s'en servirait)
  void birthDate;

  return { status: 'clear', screenedAt, matches: [] };
}
