'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Maximize2, Gauge } from 'lucide-react';
import { cn } from '@/lib/cn';

interface VideoPlayerProps {
  /** Total duration of the mock video in seconds. */
  durationSeconds: number;
  /** Fired as the user watches; receives integer seconds watched delta. */
  onProgress?: (watchedSeconds: number, percent: number) => void;
  /** Fired when 80% threshold crossed (auto-complete). */
  onWatched80?: () => void;
  /** Title shown in the overlay. */
  title?: string;
  className?: string;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

export function VideoPlayer({
  durationSeconds,
  onProgress,
  onWatched80,
  title,
  className,
}: VideoPlayerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const watched80Fired = useRef(false);
  const lastTickRef = useRef<number | null>(null);

  // Simulate playback at real-time (scaled by speed), using setInterval
  useEffect(() => {
    if (!playing) {
      lastTickRef.current = null;
      return;
    }
    const id = window.setInterval(() => {
      setElapsed((prev) => {
        const next = Math.min(durationSeconds, prev + 1 * speed);
        if (next >= durationSeconds) {
          setPlaying(false);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, speed, durationSeconds]);

  // Propagate progress + 80% threshold
  useEffect(() => {
    const percent = durationSeconds > 0 ? (elapsed / durationSeconds) * 100 : 0;
    onProgress?.(elapsed, percent);
    if (!watched80Fired.current && percent >= 80) {
      watched80Fired.current = true;
      onWatched80?.();
    }
  }, [elapsed, durationSeconds, onProgress, onWatched80]);

  const percent = durationSeconds > 0 ? (elapsed / durationSeconds) * 100 : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setElapsed(Math.min(durationSeconds, Math.max(0, val)));
  };

  return (
    <div
      className={cn(
        'relative w-full aspect-video rounded-xl overflow-hidden',
        'bg-gradient-to-br from-[#0a0618] via-[#180b3e] to-[#0d0520]',
        'shadow-xl ring-1 ring-white/10',
        className,
      )}
      role="region"
      aria-label="Lecteur vidéo"
    >
      {/* Decorative background "frames" */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(85,53,196,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(0,184,148,0.18), transparent 55%)',
        }}
        aria-hidden="true"
      />

      {/* Center title + logo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex items-center gap-2 mb-3 opacity-90">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] flex items-center justify-center shadow-md">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-white"
              aria-hidden="true"
            >
              <path
                d="M7 1.5L2 7.5h4l-1 5 5-6h-4l1-5z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="text-white font-display font-extrabold text-sm tracking-tight">
            Strick<span className="text-[#D4A017]">&lsquo;in</span> Academy
          </span>
        </div>
        {title && (
          <h3 className="text-white/85 font-display font-semibold text-base max-w-md">
            {title}
          </h3>
        )}
        <p className="text-white/40 font-body text-[11px] mt-2 uppercase tracking-widest">
          Lecteur démo — simulation
        </p>
      </div>

      {/* Big play button overlay */}
      {!playing && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Lire la vidéo"
          className={cn(
            'absolute inset-0 flex items-center justify-center group',
            'focus-visible:outline-none',
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center w-16 h-16 rounded-full',
              'bg-white/15 backdrop-blur-md ring-1 ring-white/25',
              'transition-all duration-200 group-hover:scale-110 group-hover:bg-white/25',
            )}
          >
            <Play
              size={24}
              className="text-white translate-x-[2px]"
              fill="white"
            />
          </span>
        </button>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pt-8 pb-3">
        {/* Scrubber */}
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Lire'}
            className="shrink-0 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            {playing ? (
              <Pause size={16} fill="white" />
            ) : (
              <Play size={16} fill="white" className="translate-x-[1px]" />
            )}
          </button>

          <span className="text-white/85 font-mono text-[11px] tabular-nums min-w-[48px]">
            {fmt(elapsed)}
          </span>

          <input
            type="range"
            min={0}
            max={durationSeconds}
            step={1}
            value={elapsed}
            onChange={handleScrub}
            aria-label="Progression"
            className="flex-1 h-1 rounded-full bg-white/20 appearance-none cursor-pointer accent-[#D4A017]"
            style={{
              background: `linear-gradient(90deg, #D4A017 0%, #D4A017 ${percent}%, rgba(255,255,255,0.20) ${percent}%, rgba(255,255,255,0.20) 100%)`,
            }}
          />

          <span className="text-white/60 font-mono text-[11px] tabular-nums min-w-[48px]">
            {fmt(durationSeconds)}
          </span>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center justify-between text-white/70">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Volume"
              className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
            >
              <Volume2 size={14} />
              <span className="font-body">80 %</span>
            </button>

            <div className="flex items-center gap-1 text-[11px]">
              <Gauge size={14} className="text-white/50" />
              <div className="flex gap-0.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={cn(
                      'px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors',
                      speed === s
                        ? 'bg-[#D4A017] text-black'
                        : 'bg-white/10 hover:bg-white/20 text-white/80',
                    )}
                    aria-pressed={speed === s}
                    aria-label={`Vitesse ${s}x`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tabular-nums">
              {percent.toFixed(0)} %
            </span>
            <button
              type="button"
              aria-label="Plein écran"
              className="hover:text-white transition-colors"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
