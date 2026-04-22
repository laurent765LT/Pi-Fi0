// ─── lib/kyc/ocr-engine.ts ───────────────────────────────────────────────────
// OCR mock pour documents d'identité. Aucune dépendance à Ubble ou Onfido :
// la fonction renvoie des données plausibles avec un léger délai.

export interface OCRIdentityResult {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO yyyy-mm-dd
  documentNumber: string;
  confidence: number; // 0-1
  issueDate?: string;
  expiryDate?: string;
  nationality?: string;
}

// Seed list used when the file name doesn't match anything else. The values
// are chosen to look realistic (French CNI-like numbers, plausible dates).
const MOCK_POOL: OCRIdentityResult[] = [
  {
    firstName: 'Claire',
    lastName: 'Dubois',
    birthDate: '1972-05-14',
    documentNumber: '140572X12345',
    issueDate: '2019-04-03',
    expiryDate: '2029-04-02',
    nationality: 'FRA',
    confidence: 0.97,
  },
  {
    firstName: 'Marc',
    lastName: 'Lefebvre',
    birthDate: '1985-11-22',
    documentNumber: '22FK98765',
    issueDate: '2020-07-10',
    expiryDate: '2030-07-09',
    nationality: 'FRA',
    confidence: 0.92,
  },
  {
    firstName: 'Anne',
    lastName: 'Petit',
    birthDate: '1990-03-01',
    documentNumber: 'AA4567890',
    issueDate: '2021-01-12',
    expiryDate: '2031-01-11',
    nationality: 'FRA',
    confidence: 0.89,
  },
];

function pickFromName(name: string): OCRIdentityResult {
  const normalized = name.toLowerCase();
  for (const candidate of MOCK_POOL) {
    if (normalized.includes(candidate.lastName.toLowerCase())) {
      return candidate;
    }
  }
  // Fallback : déterministe en fonction du nom de fichier.
  const hash = Array.from(normalized).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0,
  );
  return MOCK_POOL[hash % MOCK_POOL.length];
}

/**
 * Simule un passage OCR sur un document d'identité.
 * Délai de ~2s, retourne un `OCRIdentityResult`.
 */
export async function extractIdentityFromDocument(
  file: File,
): Promise<OCRIdentityResult> {
  await new Promise((r) => setTimeout(r, 1800 + Math.random() * 400));
  const base = pickFromName(file.name);
  // Ajoute un peu de bruit sur la confiance pour réalisme
  const confidence = Math.max(
    0.72,
    Math.min(0.99, base.confidence + (Math.random() - 0.5) * 0.08),
  );
  return { ...base, confidence };
}

export function formatConfidence(c: number): string {
  return `${Math.round(c * 100)} %`;
}
