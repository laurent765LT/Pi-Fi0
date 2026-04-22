'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClientProfile = 'prudent' | 'equilibre' | 'dynamique';
export type CommentaryTone = 'professionnel' | 'pedagogique' | 'technique';

export interface CommentaryParagraph {
  title: string;
  body: string;
}

export interface Commentary {
  id: string;
  productId: string;
  productName: string;
  clientProfile: ClientProfile;
  objectives: string[];
  tone: CommentaryTone;
  /** Exactly 4 paragraphs: contexte, adequation, scenarios, suivi. */
  paragraphs: CommentaryParagraph[];
  createdAt: string;
  savedToClient?: string;
}

interface CommentaryState {
  history: Commentary[];
  add: (c: Omit<Commentary, 'id' | 'createdAt'>) => Commentary;
  remove: (id: string) => void;
  clearAll: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCommentaryStore = create<CommentaryState>()(
  persist(
    (set) => ({
      history: [],
      add: (data) => {
        const commentary: Commentary = {
          ...data,
          id: `commentary-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ history: [commentary, ...state.history].slice(0, 50) }));
        return commentary;
      },
      remove: (id) =>
        set((state) => ({ history: state.history.filter((c) => c.id !== id) })),
      clearAll: () => set({ history: [] }),
    }),
    { name: 'strickin-commentaries' },
  ),
);
