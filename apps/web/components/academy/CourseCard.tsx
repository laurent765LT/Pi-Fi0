'use client';

import Link from 'next/link';
import { Award, Clock, PlayCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import type { Course, CourseCategory, CourseLevel } from '@/stores/academy-store';

// ─── Labels ─────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<CourseCategory, string> = {
  fondamentaux: 'Fondamentaux',
  priips: 'PRIIPs',
  pricing: 'Pricing',
  reglementaire: 'Réglementaire',
  kyc: 'KYC / LCB-FT',
};

const CATEGORY_COLOR: Record<CourseCategory, string> = {
  fondamentaux: '#3B1FA8',
  priips: '#5B3FD4',
  pricing: '#D4A017',
  reglementaire: '#00B894',
  kyc: '#E8334A',
};

const LEVEL_LABEL: Record<CourseLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: Course;
  completedLessons: number;
  certificateEarned: boolean;
  className?: string;
}

export function CourseCard({
  course,
  completedLessons,
  certificateEarned,
  className,
}: CourseCardProps) {
  const total = course.lessons.length;
  const pct = total > 0 ? Math.min(100, (completedLessons / total) * 100) : 0;
  const hours = Math.round((course.duration / 60) * 10) / 10;
  const accent = CATEGORY_COLOR[course.category];

  return (
    <Link
      href={`/academy/${course.id}`}
      className={cn(
        'group relative flex flex-col h-full rounded-2xl overflow-hidden',
        'bg-white dark:bg-white/5 border border-border/60',
        'shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-[#3B1FA8]/40',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
        className,
      )}
    >
      {/* Top accent */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, ${accent}80 100%)`,
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Category + level + certificate */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md"
            style={{
              background: `${accent}15`,
              color: accent,
            }}
          >
            {CATEGORY_LABEL[course.category]}
          </span>
          {certificateEarned && (
            <span
              className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md text-[#D4A017]"
              style={{ background: '#D4A01720' }}
            >
              <Award size={11} />
              Certifié
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-[16px] font-bold text-ink leading-snug line-clamp-2 min-h-[2.6em]">
          {course.title}
        </h3>

        {/* Description */}
        <p className="font-body text-[12.5px] text-ink-3 leading-relaxed line-clamp-3 flex-1">
          {course.description}
        </p>

        {/* Metadata row */}
        <div className="flex items-center gap-3 text-[11px] text-ink-3 font-body">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {hours} h
          </span>
          <span className="text-ink-3/30">•</span>
          <span className="inline-flex items-center gap-1">
            <BookOpen size={12} />
            {total} leçon{total > 1 ? 's' : ''}
          </span>
          <span className="text-ink-3/30">•</span>
          <Badge variant="muted" size="sm" className="!font-semibold">
            {LEVEL_LABEL[course.level]}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-ink-3 font-bold">
              Progression
            </span>
            <span className="text-[11px] text-ink tabular-nums font-semibold">
              {completedLessons}/{total}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-violet-pale overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              }}
            />
          </div>
        </div>

        {/* CTA footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink-2 group-hover:text-[#3B1FA8] transition-colors">
            {completedLessons === 0
              ? 'Commencer le parcours'
              : completedLessons === total
                ? 'Parcours terminé'
                : 'Continuer'}
          </span>
          <PlayCircle
            size={20}
            className="text-ink-3 group-hover:text-[#3B1FA8] transition-colors"
          />
        </div>
      </div>
    </Link>
  );
}

export { CATEGORY_LABEL, CATEGORY_COLOR, LEVEL_LABEL };
