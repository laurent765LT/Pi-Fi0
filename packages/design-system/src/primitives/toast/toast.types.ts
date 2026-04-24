export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  /** Auto-dismiss delay in ms. Pass 0 to disable. Defaults to 5000. */
  duration?: number;
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

/**
 * Shape of the object returned by the `useToast` hook.
 *
 * Consumers should import the hook itself from `apps/web/components/ui/toast`
 * (until physically moved) and rely on this interface for typing.
 */
export interface UseToastReturn {
  toasts: ToastItem[];
  toast: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'message'>>,
  ) => string;
  success: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>,
  ) => string;
  error: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>,
  ) => string;
  warning: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>,
  ) => string;
  info: (
    message: string,
    options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>,
  ) => string;
  dismiss: (id: string) => void;
}
