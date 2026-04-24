import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface DropdownProps {
  /** Element that toggles the menu (e.g. a Button). */
  trigger: ReactNode;
  /** Menu content — use DropdownItem & DropdownSeparator. */
  children: ReactNode;
  /** Horizontal alignment of the menu relative to the trigger. */
  align?: 'left' | 'right';
  className?: string;
}

export interface DropdownItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  label: string;
  /** Renders with red/danger styling. */
  danger?: boolean;
}
