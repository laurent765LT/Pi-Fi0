'use client';

import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Award, Filter, Clock, BookOpen, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { CourseCard, CATEGORY_LABEL, LEVEL_LABEL } from '@/components/academy/CourseCard';
import { buildCertificateHtml } from '@/components/academy/Certificate';
import { COURSES } from '@/lib/academy/courses-data';
import { useAcademyStore } from '@/stores/academy-store';
import { useAuthStore } from '@/stores/auth-store';
import type { CourseCategory, CourseLevel } from '@/stores/academy-store';

// ─── DPC target ──────────────────────────────────────────────────────────────

const DPC_TARGET_HOURS = 15;

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-border/60 bg-white dark:bg-white/5',
        'p-4 flex items-start gap-3 shadow-sm',
      )}
    >
      <span
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
          boxShadow: `inset 0 0 0 1px ${accent}20`,
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-ink-3 font-bold font-body">
          {label}
        </p>
        <p className="font-display text-[22px] font-extrabold text-ink tabular-nums leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-ink-3 font-body mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const progress = useAcademyStore((s) => s.progress);
  const user = useAuthStore((s) => s.user);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    document.title = "Academy | Strick'in";
  }, []);

  // ── Compute stats ─────────────────────────────────────────────────────────
  const { watchedMinutes, earnedCount, lessonsDone } = useMemo(() => {
    let mins = 0;
    let lessons = 0;
    let earned = 0;
    for (const p of progress) {
      mins += p.totalWatchedMinutes ?? 0;
      lessons += p.completedLessonIds.length;
      if (p.certificateEarnedAt) earned += 1;
    }
    return { watchedMinutes: mins, lessonsDone: lessons, earnedCount: earned };
  }, [progress]);

  const watchedHours = Math.round((watchedMinutes / 60) * 10) / 10;
  // For demo visibility, cap hours at target + some buffer
  const dpcDoneHours = Math.min(DPC_TARGET_HOURS, watchedHours);
  const dpcPct = Math.min(100, (dpcDoneHours / DPC_TARGET_HOURS) * 100);

  // ── Filtered courses ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      return true;
    });
  }, [categoryFilter, levelFilter]);

  // ── DPC attestation download ───────────────────────────────────────────────
  const handleDpcAttestation = () => {
    const u = user as {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
    const learnerName =
      u?.firstName && u?.lastName
        ? `${u.firstName} ${u.lastName}`
        : (u?.email ?? 'Conseiller Strick\'in');
    const html = buildCertificateHtml({
      learnerName,
      courseTitle: `Développement Professionnel Continu — ${dpcDoneHours.toFixed(1)} h validées`,
      earnedAt: new Date().toISOString(),
      serialNumber: `DPC-${Date.now().toString(36).toUpperCase()}`,
      durationMinutes: Math.round(dpcDoneHours * 60),
    });
    if (typeof window === 'undefined') return;
    const w = window.open('', '_blank', 'noopener');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // ── Filter options ────────────────────────────────────────────────────────
  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    ...(Object.keys(CATEGORY_LABEL) as CourseCategory[]).map((k) => ({
      value: k,
      label: CATEGORY_LABEL[k],
    })),
  ];
  const levelOptions = [
    { value: 'all', label: 'Tous les niveaux' },
    ...(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((k) => ({
      value: k,
      label: LEVEL_LABEL[k],
    })),
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        icon={GraduationCap}
        title={
          <span>
            Academy{' '}
            <span className="text-[#D4A017]">Strick&lsquo;in</span>
          </span>
        }
        subtitle="Formation certifiante sur les produits structurés, la réglementation et le pricing."
      >
        <Button
          variant="muted"
          size="sm"
          onClick={handleDpcAttestation}
          disabled={watchedHours <= 0}
          title={
            watchedHours <= 0
              ? 'Commencez un cours pour valider des heures DPC'
              : 'Générer l\u2019attestation DPC au format PDF'
          }
        >
          <Award size={14} />
          Obtenir mon attestation DPC
        </Button>
      </PageHeader>

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile
          icon={<Clock size={18} />}
          label="Heures visionnées"
          value={`${watchedHours} h`}
          sub={`${lessonsDone} leçon${lessonsDone > 1 ? 's' : ''} terminée${lessonsDone > 1 ? 's' : ''}`}
          accent="#3B1FA8"
        />
        <StatTile
          icon={<Target size={18} />}
          label="Progression DPC"
          value={`${dpcDoneHours.toFixed(1)} / ${DPC_TARGET_HOURS} h`}
          sub={`${dpcPct.toFixed(0)} % de l\u2019objectif annuel`}
          accent="#00B894"
        />
        <StatTile
          icon={<Award size={18} />}
          label="Certifications"
          value={String(earnedCount)}
          sub={`${COURSES.length} parcours disponibles`}
          accent="#D4A017"
        />
        <StatTile
          icon={<BookOpen size={18} />}
          label="Parcours en cours"
          value={String(
            progress.filter(
              (p) =>
                p.completedLessonIds.length > 0 && !p.certificateEarnedAt,
            ).length,
          )}
          sub="Reprenez où vous en étiez"
          accent="#5B3FD4"
        />
      </div>

      {/* DPC progress bar */}
      <div className="mb-6 rounded-2xl border border-border/60 bg-white dark:bg-white/5 p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-bold">
              Développement Professionnel Continu
            </p>
            <p className="font-display text-[14px] font-bold text-ink">
              Objectif annuel : {DPC_TARGET_HOURS} h de formation
            </p>
          </div>
          <span
            className={cn(
              'font-display text-xl font-extrabold tabular-nums',
              dpcPct >= 100 ? 'text-[#00B894]' : 'text-[#3B1FA8]',
            )}
          >
            {dpcPct.toFixed(0)} %
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-violet-pale overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${dpcPct}%`,
              background:
                'linear-gradient(90deg, #3B1FA8 0%, #5B3FD4 50%, #00B894 100%)',
            }}
          />
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-ink-3">
          <Filter size={13} />
          Filtres
        </div>
        <div className="min-w-[200px]">
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            options={levelOptions}
          />
        </div>
        <span className="ml-auto text-[12px] text-ink-3 font-body">
          {filtered.length} parcours
        </span>
      </div>

      {/* ── Courses grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => {
          const p = progress.find((x) => x.courseId === course.id);
          const completed = p?.completedLessonIds.length ?? 0;
          const certified = !!p?.certificateEarnedAt;
          return (
            <CourseCard
              key={course.id}
              course={course}
              completedLessons={completed}
              certificateEarned={certified}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5 p-10 text-center">
          <p className="font-display font-bold text-ink mb-1">
            Aucun parcours ne correspond aux filtres
          </p>
          <p className="text-sm text-ink-3 font-body">
            Modifiez vos critères ou affichez toute la bibliothèque.
          </p>
          <Button
            variant="muted"
            size="sm"
            className="mt-4"
            onClick={() => {
              setCategoryFilter('all');
              setLevelFilter('all');
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </main>
  );
}
