import type { HTMLAttributes, ReactNode } from 'react';

export interface TabItem {
  label: string;
  value: string;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
  /** Disable this individual tab. */
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
  /** Stretch tabs to fill available width. */
  fullWidth?: boolean;
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  activeTab: string;
  children?: ReactNode;
}
