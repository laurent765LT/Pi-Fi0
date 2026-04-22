'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CourseLevel = 'debutant' | 'intermediaire' | 'avance';
export type CourseCategory =
  | 'fondamentaux'
  | 'priips'
  | 'pricing'
  | 'reglementaire'
  | 'kyc';

export interface Quiz {
  questions: Array<{
    id: string;
    text: string;
    answers: string[];
    correctIndex: number;
    explanation: string;
  }>;
  passingScore: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  videoUrl?: string;
  transcript?: string;
  quiz?: Quiz;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: CourseLevel;
  category: CourseCategory;
  lessons: Lesson[];
  certificate: boolean;
}

export interface UserProgress {
  courseId: string;
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  certificateEarnedAt?: string;
  totalWatchedMinutes: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AcademyState {
  progress: UserProgress[];
  markLessonComplete: (courseId: string, lessonId: string) => void;
  saveQuizScore: (courseId: string, lessonId: string, score: number) => void;
  getCourseProgress: (courseId: string) => number;
  getTotalWatchedMinutes: () => number;
  getCompletedCourses: () => string[];
  earnCertificate: (courseId: string) => void;
  resetProgress: () => void;
  addWatchedMinutes: (courseId: string, minutes: number) => void;
}

// Internal helper — get or create a progress entry
function ensureProgress(
  progress: UserProgress[],
  courseId: string,
): { progress: UserProgress[]; entry: UserProgress } {
  const existing = progress.find((p) => p.courseId === courseId);
  if (existing) return { progress, entry: existing };
  const fresh: UserProgress = {
    courseId,
    completedLessonIds: [],
    quizScores: {},
    totalWatchedMinutes: 0,
  };
  return { progress: [...progress, fresh], entry: fresh };
}

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      progress: [],

      markLessonComplete: (courseId, lessonId) =>
        set((state) => {
          const { progress, entry } = ensureProgress(state.progress, courseId);
          if (entry.completedLessonIds.includes(lessonId)) {
            return { progress: state.progress };
          }
          const updated = progress.map((p) =>
            p.courseId === courseId
              ? { ...p, completedLessonIds: [...p.completedLessonIds, lessonId] }
              : p,
          );
          return { progress: updated };
        }),

      saveQuizScore: (courseId, lessonId, score) =>
        set((state) => {
          const { progress } = ensureProgress(state.progress, courseId);
          const updated = progress.map((p) =>
            p.courseId === courseId
              ? {
                  ...p,
                  quizScores: { ...p.quizScores, [lessonId]: score },
                }
              : p,
          );
          return { progress: updated };
        }),

      getCourseProgress: (courseId) => {
        const entry = get().progress.find((p) => p.courseId === courseId);
        if (!entry) return 0;
        // We need total lessons from course data — returning % based on saved count
        // The UI resolves total lessons when computing. Here we return raw count.
        // The provided API is 0-100; callers know total lessons count.
        // To keep it decoupled, compute relative to completed only; UI divides by total.
        return entry.completedLessonIds.length;
      },

      getTotalWatchedMinutes: () => {
        return get().progress.reduce(
          (sum, p) => sum + (p.totalWatchedMinutes ?? 0),
          0,
        );
      },

      getCompletedCourses: () => {
        return get()
          .progress.filter((p) => !!p.certificateEarnedAt)
          .map((p) => p.courseId);
      },

      earnCertificate: (courseId) =>
        set((state) => {
          const { progress } = ensureProgress(state.progress, courseId);
          const updated = progress.map((p) =>
            p.courseId === courseId && !p.certificateEarnedAt
              ? { ...p, certificateEarnedAt: new Date().toISOString() }
              : p,
          );
          return { progress: updated };
        }),

      addWatchedMinutes: (courseId, minutes) =>
        set((state) => {
          const { progress } = ensureProgress(state.progress, courseId);
          const updated = progress.map((p) =>
            p.courseId === courseId
              ? {
                  ...p,
                  totalWatchedMinutes: (p.totalWatchedMinutes ?? 0) + minutes,
                }
              : p,
          );
          return { progress: updated };
        }),

      resetProgress: () => set({ progress: [] }),
    }),
    { name: 'strickin-academy' },
  ),
);
