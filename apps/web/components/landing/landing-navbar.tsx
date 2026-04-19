'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Émetteurs', href: '#' },
  { label: 'Tarifs', href: '#' },
  { label: 'À propos', href: '#' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when navigating
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-border/40'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="max-w-container mx-auto px-6 h-16 flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────── */}
        <Link
          href="/"
          onClick={closeMobile}
          className={cn(
            'font-display text-xl font-extrabold tracking-tight transition-colors duration-300',
            scrolled ? 'text-ink' : 'text-white',
          )}
        >
          Strick&apos;in
        </Link>

        {/* ── Desktop nav ──────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={cn(
                  'font-body text-sm font-medium transition-colors duration-300',
                  scrolled
                    ? 'text-ink-2 hover:text-violet'
                    : 'text-white/80 hover:text-white',
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Desktop CTAs ─────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className={cn(
              'font-body text-sm font-semibold transition-colors duration-300',
              scrolled
                ? 'text-ink-2 hover:text-violet'
                : 'text-white/80 hover:text-white',
            )}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-display text-sm font-bold transition-all duration-300',
              scrolled
                ? 'bg-violet text-white hover:bg-violet-mid shadow-md shadow-violet/20'
                : 'bg-white text-violet hover:bg-white/90 shadow-md',
            )}
          >
            Demander un accès
          </Link>
        </div>

        {/* ── Mobile toggle ────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className={cn(
            'md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-300',
            scrolled
              ? 'text-ink hover:bg-ink/5'
              : 'text-white hover:bg-white/10',
          )}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile slide-down menu ─────────────────────────── */}
      <div
        id="landing-mobile-menu"
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-out',
          mobileOpen
            ? 'max-h-[480px] opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none',
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-border/40'
            : 'bg-ink/80 backdrop-blur-md border-b border-white/10',
        )}
      >
        <div className="px-6 py-4 flex flex-col gap-3">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={closeMobile}
                  className={cn(
                    'block px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-colors duration-200',
                    scrolled
                      ? 'text-ink-2 hover:bg-violet/5 hover:text-violet'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              'h-px w-full',
              scrolled ? 'bg-border/60' : 'bg-white/15',
            )}
          />

          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              onClick={closeMobile}
              className={cn(
                'block px-3 py-2.5 rounded-lg font-body text-sm font-semibold transition-colors duration-200',
                scrolled
                  ? 'text-ink-2 hover:bg-violet/5 hover:text-violet'
                  : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              onClick={closeMobile}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm font-bold transition-all duration-200',
                scrolled
                  ? 'bg-violet text-white hover:bg-violet-mid shadow-md shadow-violet/20'
                  : 'bg-white text-violet hover:bg-white/90 shadow-md',
              )}
            >
              Demander un accès
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export { LandingNavbar };
