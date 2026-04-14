'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TickerItem {
  name: string;
  value: string;
  change: string;
  positive: boolean;
}

interface MarketTickerProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TICKER_DATA: TickerItem[] = [
  { name: 'Euro Stoxx 50', value: '5,042', change: '+0.8%', positive: true },
  { name: 'CAC 40', value: '7,891', change: '+0.3%', positive: true },
  { name: 'Vol. Implicite', value: '17.8%', change: '-1.2pts', positive: false },
  { name: 'EUR CMS 10Y', value: '2.64%', change: '+3bps', positive: true },
  { name: 'iTraxx Europe', value: '52 bps', change: '', positive: true },
  { name: 'OR', value: '5,081$', change: '+1.4%', positive: true },
  { name: 'EUR/USD', value: '1.0842', change: '-0.2%', positive: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MarketTicker({ className }: MarketTickerProps) {
  return (
    <div
      className={cn(
        'relative w-full h-9 overflow-hidden',
        'bg-gradient-violet',
        className,
      )}
      aria-label="Market data ticker"
    >
      {/* Inline keyframes for seamless ticker scroll */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ticker-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `,
        }}
      />

      <div
        className="flex items-center h-full whitespace-nowrap"
        style={{
          animation: 'ticker-scroll 40s linear infinite',
          width: 'max-content',
        }}
      >
        {/* Render items twice for seamless loop */}
        {[...TICKER_DATA, ...TICKER_DATA].map((item, idx) => (
          <React.Fragment key={`${item.name}-${idx}`}>
            {idx > 0 && (
              <span
                className="inline-block w-1 h-1 rounded-full bg-white/25 mx-4 shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-body shrink-0">
              <span className="text-white/70 font-medium">{item.name}</span>
              <span className="text-white font-semibold">{item.value}</span>
              {item.change && (
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    item.positive ? 'text-teal-light' : 'text-red-light',
                  )}
                >
                  {item.change}
                </span>
              )}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export { MarketTicker };
export type { MarketTickerProps, TickerItem };
