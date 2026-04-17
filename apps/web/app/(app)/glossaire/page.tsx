'use client';

import { useState, useMemo, useEffect } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { FINANCIAL_GLOSSARY } from '@/components/ui/term-tooltip';

export default function GlossairePage() {
  useEffect(() => {
    document.title = "Glossaire | Strick'in";
  }, []);

  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const all = Object.entries(FINANCIAL_GLOSSARY).map(([term, definition]) => ({
      term,
      definition,
    }));
    const q = query.trim().toLowerCase();
    if (!q) return all.sort((a, b) => a.term.localeCompare(b.term, 'fr'));
    return all
      .filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q),
      )
      .sort((a, b) => a.term.localeCompare(b.term, 'fr'));
  }, [query]);

  return (
    <main className="w-full animate-fade-in">
      <PageHeader
        icon={BookOpen}
        title="Glossaire"
        subtitle="Définitions des termes clés des produits structurés et de la réglementation financière"
      />

      {/* Search bar */}
      <div className="relative mb-5 max-w-lg">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un terme ou une définition..."
          className={cn(
            'w-full h-10 pl-9 pr-9 rounded-xl border border-border/60 bg-white dark:bg-white/5',
            'font-body text-[13px] text-ink placeholder:text-ink-3',
            'focus:outline-none focus:ring-2 focus:ring-violet/40 focus:border-violet',
            'transition-all',
          )}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
            aria-label="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-[11px] text-ink-3 font-body mb-4">
        {entries.length} terme{entries.length > 1 ? 's' : ''}
        {query && ` correspondant à « ${query} »`}
      </p>

      {/* Grid of glossary cards */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 bg-white dark:bg-white/5 rounded-xl border border-border/40">
          <div className="w-12 h-12 rounded-2xl bg-violet-ghost dark:bg-violet/10 flex items-center justify-center">
            <Search size={20} className="text-violet/60" />
          </div>
          <p className="font-body text-[13px] font-semibold text-ink">
            Aucun terme trouvé
          </p>
          <p className="font-body text-[11px] text-ink-3">
            Essayez un autre mot-clé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.map(({ term, definition }) => (
            <article
              key={term}
              className={cn(
                'relative group rounded-xl border border-border/60 bg-white dark:bg-white/5',
                'p-4 shadow-sm hover:shadow-md hover:border-violet/30',
                'transition-all duration-200',
              )}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="font-display text-[15px] font-bold text-ink dark:text-white mb-1.5">
                {term}
              </h2>
              <p className="font-body text-[12px] text-ink-2 dark:text-white/70 leading-relaxed">
                {definition}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl border border-border/40 bg-surface-2/50 p-4">
        <p className="text-[10px] text-ink-3 font-body leading-relaxed">
          Ce glossaire est fourni à titre informatif uniquement. Pour toute
          décision d&apos;investissement, consultez le Document d&apos;Informations
          Clés (KID/PRIIPS) du produit et, si nécessaire, un conseiller agréé.
          Les produits structurés présentent un risque de perte en capital.
        </p>
      </div>
    </main>
  );
}
