'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, type ButtonSize } from '@/components/ui/button';
import {
  AICommentaryModal,
  type CommentaryProduct,
} from '@/components/ai/AICommentaryModal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AICommentaryButtonProps {
  product: CommentaryProduct;
  variant?: 'primary' | 'ghost';
  size?: ButtonSize;
  /** Shown next to the icon. Defaults to "Commentaire IA". */
  label?: string;
  /** Hide the text label and render an icon-only trigger. */
  iconOnly?: boolean;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AICommentaryButton({
  product,
  variant = 'primary',
  size = 'sm',
  label = 'Commentaire IA',
  iconOnly = false,
  className,
}: AICommentaryButtonProps) {
  const [open, setOpen] = React.useState(false);

  const handleOpen = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent triggering a parent <Link> / row click handler when nested inside tables.
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }, []);

  const handleClose = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleOpen}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={cn(
          variant === 'primary' &&
            'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] hover:opacity-90 shadow-sm',
          iconOnly && size === 'sm' && 'px-2',
          className,
        )}
      >
        <Sparkles size={12} strokeWidth={2} />
        {!iconOnly && <span>{label}</span>}
      </Button>

      <AICommentaryModal product={product} open={open} onClose={handleClose} />
    </>
  );
}

export default AICommentaryButton;
