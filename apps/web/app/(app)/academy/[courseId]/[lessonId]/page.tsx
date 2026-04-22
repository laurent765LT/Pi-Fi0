'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { VideoPlayer } from '@/components/academy/VideoPlayer';
import { Quiz } from '@/components/academy/Quiz';
import { Certificate } from '@/components/academy/Certificate';
import { getLessonById } from '@/lib/academy/courses-data';
import { useAcademyStore } from '@/stores/academy-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
} from '@/components/academy/CourseCard';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseIdRaw = params?.courseId;
  const lessonIdRaw = params?.lessonId;
  const courseId = typeof courseIdRaw === 'string' ? courseIdRaw : '';
  const lessonId = typeof lessonIdRaw === 'string' ? lessonIdRaw : '';

  const resolved = useMemo(
    () => getLessonById(courseId, lessonId),
    [courseId, lessonId],
  );

  const { toasts, success, info, dismiss } = useToast();
  const markLessonComplete = useAcademyStore((s) => s.markLessonComplete);
  const addWatchedMinutes = useAcademyStore((s) => s.addWatchedMinutes);
  const saveQuizScore = useAcademyStore((s) => s.saveQuizScore);
  const earnCertificate = useAcademyStore((s) => s.earnCertificate);
  const progressEntry = useAcademyStore((s) =>
    s.progress.find((p) => p.courseId === courseId),
  );
  const user = useAuthStore((s) => s.user);

  // Track watched minutes submitted via VideoPlayer
  const watchedReportedRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  // State: certificate just earned (to reveal preview)
  const [justEarned, setJustEarned] = useState(false);

  useEffect(() => {
    if (resolved) {
      document.title = `${resolved.lesson.title} | Strick'in Academy`;
    }
  }, [resolved]);

  // Reset refs on lesson change
  useEffect(() => {
    watchedReportedRef.current = 0;
    completedRef.current = false;
  }, [lessonId]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleProgress = useCallback(
    (watchedSeconds: number) => {
      const watchedMin = Math.floor(watchedSeconds / 60);
      if (watchedMin > watchedReportedRef.current) {
        const delta = watchedMin - watchedReportedRef.current;
        watchedReportedRef.current = watchedMin;
        addWatchedMinutes(courseId, delta);
      }
    },
    [addWatchedMinutes, courseId],
  );

  const handleWatched80 = useCallback(() => {
    if (!resolved) return;
    if (completedRef.current) return;
    completedRef.current = true;
    const alreadyDone = progressEntry?.completedLessonIds.includes(
      resolved.lesson.id,
    );
    if (alreadyDone) return;
    markLessonComplete(courseId, resolved.lesson.id);
    success('Leçon marquée comme terminée', {
      title: '80 % visionné',
    });
  }, [resolved, progressEntry, markLessonComplete, courseId, success]);

  if (!resolved) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h1 className="font-display text-xl font-bold text-ink mb-2">
          Leçon introuvable
        </h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/academy')}
        >
          <ArrowLeft size={14} />
          Retour à l&rsquo;Academy
        </Button>
      </main>
    );
  }

  const { course, lesson, index } = resolved;
  const prev = index > 0 ? course.lessons[index - 1] : null;
  const next = index < course.lessons.length - 1 ? course.lessons[index + 1] : null;
  const accent = CATEGORY_COLOR[course.category];
  const completedIds = progressEntry?.completedLessonIds ?? [];
  const isCompleted = completedIds.includes(lesson.id);
  const totalCompleted = completedIds.length;
  const totalLessons = course.lessons.length;
  const progressPct = (totalCompleted / totalLessons) * 100;

  const isLastLesson = !next;
  const allPrevComplete = course.lessons
    .slice(0, index)
    .every((l) => completedIds.includes(l.id));

  // ─── Quiz handlers ───────────────────────────────────────────────────────
  const handleQuizComplete = (score: number, passed: boolean) => {
    saveQuizScore(courseId, lesson.id, score);
    if (passed) {
      if (!isCompleted) {
        markLessonComplete(courseId, lesson.id);
      }
      info(
        `Quiz validé avec ${score} %. ` +
          (isLastLesson ? 'Parcours prêt pour certification.' : ''),
        { title: 'Résultat enregistré' },
      );
    } else {
      info(`Score : ${score} %. Vous pouvez retenter le quiz.`, {
        title: 'Quiz terminé',
      });
    }
  };

  const handleGetCertificate = () => {
    earnCertificate(courseId);
    setJustEarned(true);
    success('Félicitations, attestation délivrée', {
      title: 'Certificat débloqué',
    });
  };

  const hasCertificate = !!progressEntry?.certificateEarnedAt || justEarned;

  // Learner name
  const u = user as {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  const learnerName =
    u?.firstName && u?.lastName
      ? `${u.firstName} ${u.lastName}`
      : (u?.email ?? 'Conseiller Strick\'in');

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Link
            href={`/academy/${course.id}`}
            className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-[#3B1FA8] font-body font-semibold"
          >
            <ArrowLeft size={13} />
            {course.title}
          </Link>
          <span className="text-[11px] text-ink-3 font-body">
            Leçon {index + 1} / {totalLessons}
          </span>
        </div>

        {/* Lesson meta */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex text-[9.5px] uppercase tracking-widest font-bold px-2 py-1 rounded-md"
            style={{ background: `${accent}15`, color: accent }}
          >
            {CATEGORY_LABEL[course.category]}
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-3 font-body">
            <Clock size={12} />
            {lesson.duration} min
          </span>
          {isCompleted && (
            <Badge variant="teal" size="sm">
              <CheckCircle2 size={10} className="mr-1" />
              Terminée
            </Badge>
          )}
          {lesson.quiz && (
            <Badge variant="violet" size="sm">
              Quiz final
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-[26px] sm:text-[30px] font-extrabold text-ink leading-tight mb-5">
          {lesson.title}
        </h1>

        {/* Course progress bar */}
        <div className="mb-6">
          <div className="h-1.5 rounded-full bg-violet-pale overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              }}
            />
          </div>
        </div>

        {/* Video player (mock) */}
        <VideoPlayer
          durationSeconds={lesson.duration * 60}
          title={lesson.title}
          onProgress={handleProgress}
          onWatched80={handleWatched80}
          className="mb-6"
        />

        {/* Transcript */}
        {lesson.transcript && (
          <section className="mb-8 rounded-2xl border border-border/60 bg-white dark:bg-white/5 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-violet-pale flex items-center justify-center">
                <FileText size={14} className="text-[#3B1FA8]" />
              </span>
              <h2 className="font-display text-[15px] font-bold text-ink">
                Transcription
              </h2>
            </div>
            <p className="font-body text-[13.5px] text-ink-2 leading-relaxed whitespace-pre-line">
              {lesson.transcript}
            </p>
          </section>
        )}

        {/* Quiz (if this lesson has one) */}
        {lesson.quiz && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-[#D4A017]/15 flex items-center justify-center">
                <GraduationCap size={14} className="text-[#D4A017]" />
              </span>
              <h2 className="font-display text-[15px] font-bold text-ink">
                Évaluation finale
              </h2>
            </div>
            <Quiz
              quiz={lesson.quiz}
              onComplete={handleQuizComplete}
              onGetCertificate={
                course.certificate && allPrevComplete
                  ? handleGetCertificate
                  : undefined
              }
            />
          </section>
        )}

        {/* Certificate preview if freshly earned */}
        {course.certificate && hasCertificate && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-[#00B894]/15 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-[#00B894]" />
              </span>
              <h2 className="font-display text-[15px] font-bold text-ink">
                Votre attestation
              </h2>
            </div>
            <Certificate
              learnerName={learnerName}
              courseTitle={course.title}
              earnedAt={
                progressEntry?.certificateEarnedAt ?? new Date().toISOString()
              }
              serialNumber={`STK-${course.id.toUpperCase().slice(0, 8)}-${new Date(progressEntry?.certificateEarnedAt ?? Date.now()).getTime().toString(36).toUpperCase()}`}
              durationMinutes={course.duration}
            />
          </section>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-6 border-t border-border">
          {prev ? (
            <Button variant="muted" size="sm" asChild>
              <Link href={`/academy/${course.id}/${prev.id}`}>
                <ArrowLeft size={14} />
                Leçon précédente
              </Link>
            </Button>
          ) : (
            <span />
          )}

          {!isCompleted && !lesson.quiz && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                markLessonComplete(courseId, lesson.id);
                success('Leçon marquée comme terminée');
              }}
            >
              <CheckCircle2 size={14} />
              Marquer comme terminée
            </Button>
          )}

          {next ? (
            <Button variant="primary" size="sm" asChild>
              <Link href={`/academy/${course.id}/${next.id}`}>
                Leçon suivante
                <ArrowRight size={14} />
              </Link>
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link href={`/academy/${course.id}`}>
                <BookOpen size={14} />
                Retour au parcours
              </Link>
            </Button>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
