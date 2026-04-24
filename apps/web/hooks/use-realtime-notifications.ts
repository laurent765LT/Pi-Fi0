import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNotificationsStore } from '@/stores/notifications-store';

export function useRealtimeNotifications() {
  const { token } = useAuth();
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token || !apiUrl) return;

    const eventSource = new EventSource(
      `${apiUrl.replace('/api/v1', '')}/api/v1/notifications/stream`,
      // Note: EventSource doesn't support headers natively
      // In production, use a token query param or cookie-based auth
    );

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        addNotification({
          type: data.type ?? 'system',
          title: data.title,
          message: data.message,
          productId: data.productId,
          productName: data.productName,
        });
      } catch {
        // Ignore malformed events
      }
    });

    eventSource.onerror = () => {
      // Auto-reconnect is handled by EventSource
    };

    return () => eventSource.close();
  }, [token, apiUrl, addNotification]);
}
