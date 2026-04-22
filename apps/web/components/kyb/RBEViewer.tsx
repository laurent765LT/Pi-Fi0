'use client';

// ─── components/kyb/RBEViewer.tsx ────────────────────────────────────────────
// Liste des bénéficiaires effectifs. Met en évidence le seuil UBO (>25%).

import { AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import type { KYBBeneficiaire } from '@/stores/kyb-store';

interface RBEViewerProps {
  siren?: string;
  beneficiaires: KYBBeneficiaire[];
  loading?: boolean;
}

export function RBEViewer({ siren, beneficiaires, loading }: RBEViewerProps) {
  const uboCount = beneficiaires.filter((b) => b.pctDetention > 25).length;
  const total = beneficiaires.reduce((s, b) => s + b.pctDetention, 0);
  const coherent = Math.abs(total - 100) <= 1;

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface/40">
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="text-violet" />
          <h3 className="font-display font-bold text-[14px] text-ink">
            Bénéficiaires effectifs (RBE)
          </h3>
        </div>
        {siren && (
          <span className="font-mono text-[10px] text-ink-3">
            SIREN {siren}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-6">
          <div className="h-6 w-44 bg-surface-2 rounded animate-pulse mb-2" />
          <div className="h-12 bg-surface-2/70 rounded animate-pulse" />
        </div>
      ) : beneficiaires.length === 0 ? (
        <div className="p-6 text-center text-sm text-ink-3 font-body">
          Aucun bénéficiaire effectif renseigné.
        </div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 border-b border-border/60">
              <tr>
                <th className="text-left px-4 py-2 font-body text-[10px] uppercase tracking-widest font-bold text-ink-3">
                  Nom
                </th>
                <th className="text-left px-4 py-2 font-body text-[10px] uppercase tracking-widest font-bold text-ink-3">
                  Prénom
                </th>
                <th className="text-right px-4 py-2 font-body text-[10px] uppercase tracking-widest font-bold text-ink-3">
                  Détention
                </th>
                <th className="text-right px-4 py-2 font-body text-[10px] uppercase tracking-widest font-bold text-ink-3">
                  Statut UBO
                </th>
              </tr>
            </thead>
            <tbody>
              {beneficiaires.map((b, i) => {
                const isUbo = b.pctDetention > 25;
                return (
                  <tr
                    key={`${b.nom}-${b.prenom}-${i}`}
                    className={cn(
                      'border-b border-border/50 last:border-b-0',
                      isUbo ? 'bg-violet-pale/30' : '',
                    )}
                  >
                    <td className="px-4 py-2.5 font-body text-[13px] font-semibold text-ink">
                      {b.nom.toUpperCase()}
                    </td>
                    <td className="px-4 py-2.5 font-body text-[13px] text-ink-2">
                      {b.prenom}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          'font-mono text-[13px] font-bold',
                          isUbo ? 'text-violet' : 'text-ink',
                        )}
                      >
                        {b.pctDetention.toFixed(0)} %
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isUbo ? (
                        <Badge variant="violet" size="sm">
                          UBO
                        </Badge>
                      ) : (
                        <Badge variant="muted" size="sm">
                          &le; 25 %
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-start gap-2 px-4 py-3 border-t border-border/60 bg-surface/40">
            {coherent ? (
              <>
                <ShieldCheck size={14} className="text-teal shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-body text-[12px] text-ink">
                    Capital coherent (total 100 %).{' '}
                    <span className="font-semibold text-violet">
                      {uboCount} UBO identifi{uboCount > 1 ? 'és' : 'é'}
                    </span>{' '}
                    au sens de la directive AMLD 5.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle
                  size={14}
                  className="text-[#9B7210] shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-body text-[12px] text-ink">
                    Somme des détentions : <strong>{total.toFixed(0)} %</strong>.
                    Vérifiez la cohérence avant validation.
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
