// ─── Web Vitals Reporting ───────────────────────────────────────────────────
// Captures Core Web Vitals (LCP, FID, CLS, TTFB, INP) and sends them
// to an analytics endpoint or logs them in development.

type MetricName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';

interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

function sendToAnalytics(metric: WebVitalMetric) {
  // In production, send to your analytics endpoint
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      page: window.location.pathname,
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(process.env.NEXT_PUBLIC_ANALYTICS_URL, body);
    } else {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
        body,
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  }

  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    const color =
      metric.rating === 'good'
        ? '#00B894'
        : metric.rating === 'needs-improvement'
          ? '#D4A017'
          : '#E8334A';

    console.log(
      `%c[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`,
    );
  }
}

export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
    onCLS(sendToAnalytics as any);
    onFCP(sendToAnalytics as any);
    onINP(sendToAnalytics as any);
    onLCP(sendToAnalytics as any);
    onTTFB(sendToAnalytics as any);
  }).catch(() => {
    // web-vitals not installed, skip
  });
}
