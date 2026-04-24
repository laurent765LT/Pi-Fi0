'use client';

// TODO: migrate Sprint 2 — jurisdiction preference is a user-scoped setting
// that should move to `useUserProfile().locale` / a dedicated settings hook.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JURISDICTION_CONFIGS } from '@/lib/regulatory/jurisdiction-rules';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Jurisdiction = 'FR' | 'LU' | 'BE' | 'CH';

export interface JurisdictionConfig {
  code: Jurisdiction;
  name: string;
  /** Emoji flag (two regional indicator symbols). */
  flag: string;
  /** Regulator short name: AMF, CSSF, FSMA, FINMA. */
  regulator: string;
  regulatorFullName: string;
  /** Registry used to check advisor registration (ORIAS, Registre CSSF, ...). */
  registryName: string;
  currency: 'EUR' | 'CHF';
  /** Required regulatory docs for onboarding in this jurisdiction. */
  requiredDocs: string[];
  /** VAT / TVA rate in percent. */
  vatRate: number;
  /** BCP-47 language tag (fr-FR, fr-LU, fr-BE, fr-CH). */
  language: string;
}

interface JurisdictionState {
  current: Jurisdiction;
  setJurisdiction: (j: Jurisdiction) => void;
  getConfig: (j: Jurisdiction) => JurisdictionConfig;
  /** Derived: config of the current jurisdiction (for convenience). */
  getCurrentConfig: () => JurisdictionConfig;
}

// ─── Store ──────────────────────────────────────────────────────────────────
//
// Persisted under `strickin-jurisdiction` (localStorage). FR is the default
// for backward compatibility with the existing onboarding flow.

export const useJurisdictionStore = create<JurisdictionState>()(
  persist(
    (set, get) => ({
      current: 'FR',
      setJurisdiction: (j) => set({ current: j }),
      getConfig: (j) => JURISDICTION_CONFIGS[j],
      getCurrentConfig: () => JURISDICTION_CONFIGS[get().current],
    }),
    {
      name: 'strickin-jurisdiction',
      partialize: (state) => ({ current: state.current }),
    },
  ),
);

// ─── Selectors ──────────────────────────────────────────────────────────────
//
// Small selectors so consumers can subscribe to specific slices and avoid
// re-rendering when unrelated state changes (Zustand best-practice).

export const selectCurrentJurisdiction = (s: JurisdictionState): Jurisdiction =>
  s.current;

export const selectCurrentJurisdictionConfig = (
  s: JurisdictionState,
): JurisdictionConfig => JURISDICTION_CONFIGS[s.current];
