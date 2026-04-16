'use client';

import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accentFrom?: string;
  accentTo?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  accentFrom = '#3B1FA8',
  accentTo = '#1A0A3E',
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentFrom} 0%, ${accentTo} 100%)`,
            }}
          >
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-[28px] font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-ink-3 font-body mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 shrink-0">{children}</div>
        )}
      </div>
      <div
        className="h-[2px] rounded-full mt-5 opacity-60"
        style={{
          background:
            'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />
    </div>
  );
}
