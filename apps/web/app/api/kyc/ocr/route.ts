// ─── POST /api/kyc/ocr ───────────────────────────────────────────────────────
// Accepte FormData avec un fichier `file` (image ou PDF) et renvoie l'extraction
// OCR (mock). En prod : intégration Ubble / Onfido / Mindee.

import { NextResponse } from 'next/server';
import { extractIdentityFromDocument } from '@/lib/kyc/ocr-engine';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'FormData attendu (multipart/form-data).' },
      { status: 400 },
    );
  }

  const fileEntry = formData.get('file');
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Champ 'file' manquant ou invalide." },
      { status: 400 },
    );
  }

  if (fileEntry.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux (>10 Mo).' },
      { status: 413 },
    );
  }

  try {
    const result = await extractIdentityFromDocument(fileEntry);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'OCR indisponible.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
