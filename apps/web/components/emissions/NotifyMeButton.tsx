'use client';

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useEmissionsStore } from '@/stores/emissions-store';
import {
  requestPushPermission,
  sendPushNotification,
} from '@/lib/notifications/push-service';

interface NotifyMeButtonProps {
  emissionId: string;
  emissionName?: string;
  size?: 'sm' | 'md';
  className?: string;
  onToggle?: (subscribed: boolean) => void;
}

export function NotifyMeButton({
  emissionId,
  emissionName,
  size = 'md',
  className,
  onToggle,
}: NotifyMeButtonProps) {
  const addAlert = useEmissionsStore((s) => s.addAlert);
  const removeAlert = useEmissionsStore((s) => s.removeAlert);
  const alerts = useEmissionsStore((s) => s.alerts);
  const subscribed = alerts.some((a) => a.emissionId === emissionId);

  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (subscribed) {
        removeAlert(emissionId);
        onToggle?.(false);
      } else {
        // Best-effort push permission request; silent failure.
        await requestPushPermission().catch(() => {});

        addAlert(emissionId);

        // Fire-and-forget backend notify intent.
        try {
          await fetch('/api/emissions/notify-me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emissionId,
              action: 'subscribe',
            }),
          });
        } catch {
          // noop — alert still persisted client-side
        }

        // Confirmation push (best-effort, silent failure)
        if (emissionName) {
          sendPushNotification(
            "Alerte Strick'in activée",
            `Nous vous préviendrons à l'ouverture de « ${emissionName} ».`,
            `/emissions-a-venir`,
          ).catch(() => {});
        }

        onToggle?.(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const sizeClasses =
    size === 'sm' ? 'h-7 px-3 text-xs gap-1.5' : 'h-9 px-4 text-sm gap-2';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={subscribed}
      aria-label={subscribed ? 'Désactiver l\'alerte' : 'Activer une alerte'}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-body font-semibold',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1',
        'disabled:opacity-60 disabled:pointer-events-none',
        sizeClasses,
        subscribed
          ? 'bg-[#00B894]/10 text-[#007A63] border border-[#00B894]/30 hover:bg-[#00B894]/15'
          : 'bg-violet text-white hover:bg-violet-dark shadow-xs hover:shadow-violet',
        className,
      )}
    >
      {subscribed ? (
        <>
          <Check size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />
          <span>Alerte activée</span>
        </>
      ) : (
        <>
          <Bell size={size === 'sm' ? 12 : 14} strokeWidth={2.0} />
          <span>M&apos;alerter à l&apos;ouverture</span>
        </>
      )}
    </button>
  );
}
