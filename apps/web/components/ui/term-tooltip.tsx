'use client';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TermTooltipProps {
  term: string;
  definition: string;
  children?: React.ReactNode;
}

export function TermTooltip({ term, definition, children }: TermTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1">
      {children ?? term}
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center text-ink-3 hover:text-violet transition-colors"
        aria-label={`Définition : ${term}`}
      >
        <HelpCircle size={12} />
      </button>
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50',
            'w-64 p-3 rounded-lg',
            'bg-[#1A0A3E] text-white text-[11px] font-body leading-relaxed',
            'shadow-xl border border-violet/20',
            'pointer-events-none'
          )}
        >
          <strong className="block font-semibold text-[12px] mb-1">{term}</strong>
          {definition}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1A0A3E]" />
        </span>
      )}
    </span>
  );
}

// Glossary of common terms
export const FINANCIAL_GLOSSARY: Record<string, string> = {
  'SRI': 'Synthetic Risk Indicator : indicateur de risque de 1 (très faible) à 7 (très élevé), combinant le risque de marché et le risque de crédit de l\'émetteur.',
  'Barrière': 'Niveau du sous-jacent en dessous duquel le capital n\'est plus protégé. Exprimée en % du niveau initial (ex: barrière 60% = perte si le sous-jacent chute de plus de 40%).',
  'Autocall Phoenix': 'Produit structuré avec remboursement anticipé automatique (autocall) si le sous-jacent dépasse un seuil, versant un coupon à chaque date d\'observation tant qu\'une barrière est respectée.',
  'Worst-Of': 'Produit dont la performance dépend du sous-jacent le moins performant parmi plusieurs. Plus risqué qu\'un produit mono-sous-jacent.',
  'Coupon': 'Versement périodique (trimestriel, semestriel ou annuel) exprimé en % du nominal investi, conditionné au respect de la barrière de coupon.',
  'Capital protégé': 'Le capital initial est garanti à l\'échéance par l\'émetteur, sous réserve de son risque de défaut (risque de crédit).',
  'ISIN': 'International Securities Identification Number : code unique à 12 caractères identifiant un produit financier sur les marchés internationaux.',
  'MIF II': 'Directive européenne sur les Marchés d\'Instruments Financiers (2014/65/UE) régissant la distribution de produits financiers et la protection des investisseurs.',
  'PRIIPs': 'Packaged Retail and Insurance-based Investment Products : règlement européen encadrant l\'information précontractuelle des produits structurés (KID obligatoire).',
  'KID': 'Key Information Document : document standardisé de 3 pages maximum présentant les caractéristiques essentielles, risques et scénarios d\'un produit structuré.',
  'Strike': 'Niveau initial du sous-jacent utilisé comme référence pour calculer la performance du produit (100% = niveau à la date de constatation initiale).',
  'Observation': 'Date à laquelle on constate le niveau du sous-jacent pour déterminer le déclenchement d\'un mécanisme (autocall, paiement de coupon, etc.).',
  'Émetteur': 'Établissement bancaire ou financier qui émet et garantit le produit structuré (BNP Paribas, Société Générale, Natixis, etc.). Son risque de crédit impacte le produit.',
  'Reverse Convertible': 'Produit structuré qui verse un coupon fixe, avec remboursement du capital en cash si la barrière est respectée, ou en titres si elle est franchie.',
};
