import type { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  /** Max-width class override, defaults to `max-w-md`. */
  maxWidth?: string;
  className?: string;
}
