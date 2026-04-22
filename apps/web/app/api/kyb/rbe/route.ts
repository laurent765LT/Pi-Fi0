// ─── GET /api/kyb/rbe?siren=123456789 ────────────────────────────────────────
// Renvoie les bénéficiaires effectifs (mock). En prod : API INPI RBE.

import { NextResponse } from 'next/server';
import type { KYBBeneficiaire } from '@/stores/kyb-store';

interface RBEResponse {
  siren: string;
  beneficiairesEffectifs: KYBBeneficiaire[];
  screeningResult: 'clear' | 'warning' | 'sanction';
  bodaccAnnouncements: Array<{
    date: string;
    type: string;
    summary: string;
  }>;
}

const RBE_DATABASE: Record<
  string,
  Omit<RBEResponse, 'siren'>
> = {
  '892451603': {
    beneficiairesEffectifs: [
      { nom: 'Dubois', prenom: 'Claire', pctDetention: 75 },
      { nom: 'Dubois', prenom: 'Étienne', pctDetention: 25 },
    ],
    screeningResult: 'clear',
    bodaccAnnouncements: [],
  },
  '519884011': {
    beneficiairesEffectifs: [
      { nom: 'Lefebvre', prenom: 'Marc', pctDetention: 60 },
      { nom: 'Roux', prenom: 'Sylvie', pctDetention: 40 },
    ],
    screeningResult: 'warning',
    bodaccAnnouncements: [
      {
        date: '2025-11-14',
        type: 'Modification statutaire',
        summary: 'Changement de gérance partielle publié au BODACC.',
      },
    ],
  },
  '441234567': {
    beneficiairesEffectifs: [
      { nom: 'Dupont', prenom: 'Jean', pctDetention: 100 },
    ],
    screeningResult: 'clear',
    bodaccAnnouncements: [],
  },
};

function deterministicBeneficiaires(
  siren: string,
): Omit<RBEResponse, 'siren'> {
  const first = Number(siren.slice(0, 2));
  const second = Number(siren.slice(2, 4));
  const pctA = 50 + (first % 5) * 5;
  const pctB = 100 - pctA;
  return {
    beneficiairesEffectifs: [
      { nom: 'Martin', prenom: 'Sophie', pctDetention: pctA },
      {
        nom: 'Durand',
        prenom: 'Laurent',
        pctDetention: pctB,
      },
    ],
    screeningResult: second % 11 === 0 ? 'warning' : 'clear',
    bodaccAnnouncements:
      second % 11 === 0
        ? [
            {
              date: '2025-09-03',
              type: 'Avis d\u2019inscription',
              summary: 'Nouvelle inscription au BODACC.',
            },
          ]
        : [],
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siren = (url.searchParams.get('siren') ?? '').replace(/\D/g, '');

  if (siren.length !== 9) {
    return NextResponse.json(
      { error: 'SIREN invalide : 9 chiffres attendus.' },
      { status: 400 },
    );
  }

  await new Promise((r) => setTimeout(r, 700 + Math.random() * 400));

  const known = RBE_DATABASE[siren];
  const payload: RBEResponse = known
    ? { siren, ...known }
    : { siren, ...deterministicBeneficiaires(siren) };

  return NextResponse.json(payload);
}
