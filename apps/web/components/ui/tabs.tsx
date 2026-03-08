'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface TabItem {
  label: string;
  value: string;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
  /** Disable this individual tab */
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
  /** Stretch tabs to fill available width */
  fullWidth?: boolean;
}

function Tabs({ tabs, activeTab, onChange, className, fullWidth = false }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'flex border-b border-border',
        fullWidth && 'w-full',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.value}`}
            id={`tab-${tab.value}`}
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) onChange(tab.value);
            }}
            className={cn(
              'relative inline-flex items-center gap-1.5 px-4 py-2.5',
              'font-body text-sm font-semibold',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-inset',
              'disabled:pointer-events-none disabled:opacity-40',
              // Bottom border indicator — rendered as a pseudo-border using border-b-2
              'border-b-2',
              isActive
                ? 'text-violet border-violet'
                : 'text-ink-3 border-transparent hover:text-ink-2 hover:border-border-2',
              fullWidth && 'flex-1 justify-center',
            )}
          >
            {tab.icon && (
              <span className="shrink-0 text-current">{tab.icon}</span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// Optional panel wrapper for accessibility
interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  activeTab: string;
  children?: React.ReactNode;
}

function TabPanel({ value, activeTab, children, className, ...props }: TabPanelProps) {
  if (value !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn('outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabPanel };
export type { TabsProps, TabItem, TabPanelProps };
