import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  /** Show an in-dropdown search input for long option lists. */
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
}
