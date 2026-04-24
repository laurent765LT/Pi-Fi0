'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Lock,
  Play,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Certificate } from '@/components/academy/Certificate';
import { getCourseById } from '@/lib/academy/courses-data';
import { useAcademyStore } from '@/stores/academy-store';
import { useAuth } from '@/hooks/use-auth';
import {
  CATEGORY_LABEL,
  CATEGORY_COLOR,
  LEVEL_LABEL,
} from '@/components/academy/CourseCard';

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseIdRaw = params?.courseId;
  const courseId = typeof courseIdRaw === 'string' ? courseIdRaw : '';

  const course = useMemo(() => getCourseById(courseId), [courseId]);

  const progressEntry = useAcademyStore((s) =>
    s.progress.find((p) => p.courseId === courseId),
  );
  const { user } = useAuth();

  useEffect(() => {
    if (course) {
      document.title = `${course.title} | Strick'in Academy`;
    }
  }, [course]);

  if (!course) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h1 className="font-display text-xl font-bold text-ink mb-2">
          Parcours introuvable
        </h1>
        <p className="text-sm text-ink-3 mb-5">
          Le cours que vous cherchez n&rsquo;existe pas ou a été retiré.
        </p>
        <Button variant="primary" size="sm" onClick={() => router.push('/academy')}>
          <ArrowLeft size={14} />
          Retour à l&rsquo;Academy
        </Button>
      </main>
    );
  }

  const completedIds = progressEntry?.completedLessonIds ?? [];
  const completedCount = completedIds.length;
  const total = course.lessons.length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const hasCertificate = !!progressEntry?.certificateEarnedAt;
  const accent = CATEGORY_COLOR[course.category];

  // Figure out the next lesson (first non-complete)
  const nextLesson =
    course.lessons.find((l) => !completedIds.includes(l.id)) ?? course.lessons[0];
  const hasStarted = completedCount > 0;

  // Learner name for certificate
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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/academy"
        className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-[#3B1FA8] font-body font-semibold mb-4"
      >
        <ArrowLeft size={13} />
        Tous les parcours
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-border/60 bg-white dark:bg-white/5 overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
          }}
        />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="inline-flex text-[9.5px] uppercase tracking-widest font-bold px-2 py-1 rounded-md"
              style={{ background: `${accent}15`, color: accent }}
            >
              {CATEGORY_LABEL[course.category]}
            </span>
            <Badge variant="muted" size="sm">
              {LEVEL_LABEL[course.level]}
            </Badge>
            {course.certificate && (
              <Badge variant="gold" size="sm">
                <Award size={10} className="mr-1" />
                Certifiant
              </Badge>
            )}
          </div>
          <h1 className="font-display text-[26px] sm:text-[30px] font-extrabold text-ink leading-tight mb-2">
            {course.title}
          </h1>
          <p className="font-body text-[14px] text-ink-2 leading-relaxed max-w-3xl mb-5">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[12px] text-ink-3 font-body mb-5">
            <span className="inline-flex items-center gap-1">
              <Clock size={13} />
              {(course.duration / 60).toFixed(1)} h de formation
            </span>
            <span className="text-ink-3/30">•</span>
            <span className="inline-flex items-center gap-1">
              <BookOpen size={13} />
              {total} leçon{total > 1 ? 's' : ''}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">
                Progression
              </span>
              <span className="text-[12px] font-semibold text-ink tabular-nums">
                {completedCount}/{total} leçons ({progressPct} %)
              </span>
            </div>
            <div className="h-2 rounded-full bg-violet-pale overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                }}
              />
            </div>
          </div>

          {/* CTA */}
          <Button variant="primary" size="md" asChild>
            <Link href={`/academy/${course.id}/${nextLesson.id}`}>
              <Play size={14} />
              {hasStarted && progressPct < 100
                ? 'Continuer le parcours'
                : progressPct === 100
                  ? 'Revoir le parcours'
                  : 'Démarrer le parcours'}
              <ChevronRight size={14} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Lessons list */}
      <div className="mb-8">
        <PageHeader icon={BookOpen} title="Plan de formation" />
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5 overflow-hidden">
          {course.lessons.map((lesson, idx) => {
            const isDone = completedIds.includes(lesson.id);
            const isUnlocked = idx === 0 || completedIds.includes(course.lessons[idx - 1].id);
            const isCurrent = !isDone && isUnlocked;
            return (
              <Link
                key={lesson.id}
                href={isUnlocked ? `/academy/${course.id}/${lesson.id}` : '#'}
                aria-disabled={!isUnlocked}
                onClick={(e) => {
                  if (!isUnlocked) e.preventDefault();
                }}
                className={cn(
                  'flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0',
                  'transition-colors group',
                  isUnlocked
                    ? 'hover:bg-[#3B1FA8]/[0.03] cursor-pointer'
                    : 'opacity-55 cursor-not-allowed',
                )}
              >
                {/* Icon */}
                <span
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    isDone
                      ? 'bg-[#00B894]/15 text-[#00B894]'
                      : isCurrent
                        ? 'bg-[#3B1FA8]/15 text-[#3B1FA8]'
                        : 'bg-surface-2 text-ink-3',
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} />
                  ) : !isUnlocked ? (
                    <Lock size={15} />
                  ) : isCurrent ? (
                    <Play size={16} fill="currentColor" className="translate-x-[1px]" />
                  ) : (
                    <Circle size={16} />
                  )}
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-2 font-display text-[14px] font-bold text-ink leading-snug">
                    <span className="text-ink-3 font-mono text-[11px] font-semibold">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {lesson.title}
                    {lesson.quiz && (
                      <Badge variant="violet" size="sm">
                        Quiz
                      </Badge>
                    )}
                  </p>
                  <p className="text-[11.5px] text-ink-3 font-body mt-0.5">
                    {lesson.duration} min
                    {lesson.quiz
                      ? ` • ${lesson.quiz.questions.length} questions · score requis ${lesson.quiz.passingScore} %`
                      : ''}
                  </p>
                </div>

                {/* Right chevron */}
                {isUnlocked && (
                  <ChevronRight
                    size={16}
                    className="text-ink-3 group-hover:text-[#3B1FA8] transition-colors shrink-0"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Certificate preview */}
      {course.certificate && hasCertificate && progressEntry?.certificateEarnedAt && (
        <div className="mb-8">
          <PageHeader
            icon={Sparkles}
            title="Votre attestation"
            subtitle="Félicitations, vous avez terminé ce parcours certifiant."
          />
          <Certificate
            learnerName={learnerName}
            courseTitle={course.title}
            earnedAt={progressEntry.certificateEarnedAt}
            serialNumber={`STK-${course.id.toUpperCase().slice(0, 8)}-${new Date(progressEntry.certificateEarnedAt).getTime().toString(36).toUpperCase()}`}
            durationMinutes={course.duration}
          />
        </div>
      )}
    </main>
  );
}
