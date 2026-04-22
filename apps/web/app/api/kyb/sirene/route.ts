// ─── GET /api/kyb/sirene?siren=123456789 ─────────────────────────────────────
// Renvoie des infos SIRENE mockées pour un SIREN valide.
// En prod : https://api.insee.fr/entreprises/sirene/V3/ (nécessite un token).

import { NextResponse } from 'next/server';
import type { KYBDirigeant } from '@/stores/kyb-store';

interface SireneMock {
  siren: string;
  denomination: string;
  formeJuridique: string;
  capital: number;
  adresse: string;
  dirigeants: KYBDirigeant[];
  kbisDate: string;
}

const SIRENE_DATABASE: Record<string, Omit<SireneMock, 'siren'>> = {
  '892451603': {
    denomination: 'Cabinet Dubois Patrimoine',
    formeJuridique: 'SAS',
    capital: 50_000,
    adresse: '12 rue de la Bourse, 75002 Paris',
    dirigeants: [
      { nom: 'Dubois', prenom: 'Claire', fonction: 'Présidente' },
    ],
    kbisDate: '2026-02-15',
  },
  '519884011': {
    denomination: 'Lefebvre & Associés',
    formeJuridique: 'SARL',
    capital: 30_000,
    adresse: '55 avenue Foch, 69006 Lyon',
    dirigeants: [
      { nom: 'Lefebvre', prenom: 'Marc', fonction: 'Gérant' },
      { nom: 'Roux', prenom: 'Sylvie', fonction: 'Co-gérante' },
    ],
    kbisDate: '2026-03-20',
  },
  '441234567': {
    denomination: 'Strick\u2019in Conseil',
    formeJuridique: 'SAS',
    capital: 100_000,
    adresse: "10 boulevard Haussmann, 75009 Paris",
    dirigeants: [
      { nom: 'Dupont', prenom: 'Jean', fonction: 'Président' },
    ],
    kbisDate: '2026-01-08',
  },
};

function deterministicMock(siren: string): Omit<SireneMock, 'siren'> {
  // Génère une entreprise fictive cohérente à partir du SIREN
  const last = Number(siren.slice(-1));
  const formes = ['SAS', 'SARL', 'SA', 'EURL', 'SNC'];
  const forme = formes[last % formes.length];
  const capital = 10_000 + (Number(siren.slice(0, 3)) % 99) * 1_000;
  return {
    denomination: `Entreprise Mock ${siren.slice(0, 3)}`,
    formeJuridique: forme,
    capital,
    adresse: `${(Number(siren.slice(3, 6)) % 250) + 1} rue de la Démo, 75001 Paris`,
    dirigeants: [
      { nom: 'Martin', prenom: 'Sophie', fonction: 'Dirigeante' },
    ],
    kbisDate: '2026-01-15',
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

  await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));

  const known = SIRENE_DATABASE[siren];
  const payload: SireneMock = known
    ? { siren, ...known }
    : { siren, ...deterministicMock(siren) };

  return NextResponse.json(payload);
}
