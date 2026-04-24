/**
 * Primitive UI types — the shared contract for Strick'in's base building
 * blocks. Runtime implementations currently live in
 * `apps/web/components/ui/*`; this barrel only re-exports the types so a
 * future mobile package (or a refactor into this directory) can swap the
 * implementation without breaking callers.
 *
 * To add a primitive:
 *   1. Create `primitives/<name>/<name>.types.ts`
 *   2. Create `primitives/<name>/index.ts` re-exporting the types
 *   3. Add a line below
 */

export type { ButtonProps, ButtonVariant, ButtonSize } from './button';

export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './card';

export type { BadgeProps, BadgeVariant, BadgeSize } from './badge';

export type { InputProps } from './input';

export type { SelectProps, SelectOption } from './select';

export type {
  CheckboxProps,
  CheckboxGroupProps,
  CheckboxGroupOption,
} from './checkbox';

export type { ModalProps } from './modal';

export type {
  ToastType,
  ToastItem,
  ToastContainerProps,
  UseToastReturn,
} from './toast';

export type { TooltipProps, TooltipSide } from './tooltip';

export type { DropdownProps, DropdownItemProps } from './dropdown';

export type { TabsProps, TabItem, TabPanelProps } from './tabs';

export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonCardProps,
} from './skeleton';

export type { PaginationProps } from './pagination';

export type { BreadcrumbProps, BreadcrumbItem } from './breadcrumb';

export type { AvatarProps, AvatarSize, AvatarShape } from './avatar';

export type { AlertProps, AlertVariant } from './alert';
