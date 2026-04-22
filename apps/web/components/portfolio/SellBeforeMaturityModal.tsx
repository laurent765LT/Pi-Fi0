'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { useSecondaryPricingStore, type LiquidityTier } from '@/stores/secondary-pricing-store';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

const LIQUIDITY_VARIANT: Record<LiquidityTier, 'teal' | 'gold' | 'muted' | 'red'> = {
  Excellent: 'teal',
  Bon: 'gold',
  Moyen: 'muted',
  Faible: 'red',
};

interface SellBeforeMaturityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  /** Total amount held by the user in EUR. */
  holdingAmount: number;
  /** Optional purchase price in % of nominal (defaults to 100). */
  purchasePrice?: number;
}

function fmtCcy(v: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v);
}

export function SellBeforeMaturityModal({
  isOpen,
  onClose,
  productId,
  holdingAmount,
  purchasePrice = 100,
}: SellBeforeMaturityModalProps) {
  const quote = useSecondaryPricingStore((s) => s.quotes[productId]);
  const product = useMemo(() => DEMO_PRODUCTS.find((p) => p.id === productId) ?? null, [productId]);

  const [quantity, setQuantity] = useState<number>(holdingAmount);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { toasts, success, error, dismiss } = useToast();

  useEffect(() => {
    if (isOpen) {
      setQuantity(holdingAmount);
      setOrderId(null);
      setSubmitting(false);
    }
  }, [isOpen, holdingAmount]);

  const sellPrice = quote?.bid ?? 100;
  const estProceeds = quantity * (sellPrice / 100);
  const estCost = quantity * (purchasePrice / 100);
  const pnl = estProceeds - estCost;
  const pnlPct = estCost > 0 ? (pnl / estCost) * 100 : 0;

  const handleConfirm = async () => {
    if (!product || !quote) return;
    setSubmitting(true);
    try {
      // Simulate order submission
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const id = `ORD-${Date.now().toString(36).toUpperCase()}`;
      setOrderId(id);
      success(`Ordre de vente ${id} transmis au marché secondaire.`);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product || !quote) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Vente anticipée indisponible">
        <p className="text-sm text-ink-2">
          Aucune cotation secondaire n'est disponible pour ce produit pour l'instant.
        </p>
        <div className="mt-4 flex justify-end">
          <Button variant="muted" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={submitting ? () => undefined : onClose}
        title="Vente anticipée"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {/* Product summary */}
          <div className="p-4 rounded-lg bg-surface-2/60 border border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-body text-[13px] font-semibold text-ink">{product.name}</div>
                <div className="font-mono text-[10px] text-ink-3 mt-0.5">{product.isin}</div>
              </div>
              <Badge variant={LIQUIDITY_VARIANT[quote.liquidity]} size="sm">
                {quote.liquidity}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <InfoBlock label="Bid" value={quote.bid.toFixed(2)} />
              <InfoBlock label="Ask" value={quote.ask.toFixed(2)} />
              <InfoBlock label="Spread" value={`${quote.spread.toFixed(0)}bps`} />
            </div>
          </div>

          {/* Quantity slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="sell-qty" className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body">
                Montant à revendre
              </label>
              <span className="font-mono text-[12px] font-semibold text-ink">
                {fmtCcy(quantity)} / {fmtCcy(holdingAmount)}
              </span>
            </div>
            <input
              id="sell-qty"
              type="range"
              min={0}
              max={holdingAmount}
              step={Math.max(1000, Math.round(holdingAmount / 100))}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={submitting || !!orderId}
              className="w-full accent-[#3B1FA8]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-3 mt-1">
              <span>0</span>
              <span>{fmtCcy(holdingAmount)}</span>
            </div>
          </div>

          {/* P&L */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#3B1FA8]/5 to-[#5B3FD4]/3 border border-violet/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-3">
                  Prix de vente
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {sellPrice.toFixed(2)}%
                </div>
                <div className="text-[10px] font-body text-ink-3 mt-0.5">
                  vs achat à {purchasePrice.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-3">
                  Produit estimé
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {fmtCcy(estProceeds)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-3">P&L</div>
                <div
                  className={cn(
                    'font-display text-base font-bold',
                    pnl >= 0 ? 'text-[#007A63]' : 'text-red',
                  )}
                >
                  {pnl >= 0 ? '+' : ''}
                  {fmtCcy(pnl)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-3">
                  Performance
                </div>
                <div
                  className={cn(
                    'font-display text-base font-bold',
                    pnlPct >= 0 ? 'text-[#007A63]' : 'text-red',
                  )}
                >
                  {pnlPct >= 0 ? '+' : ''}
                  {pnlPct.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FDF3D6] border border-[#F0D98A]">
            <AlertTriangle size={14} className="text-[#9B7210] shrink-0 mt-0.5" />
            <p className="text-[11px] font-body text-[#9B7210] leading-relaxed">
              La vente anticipée peut entraîner une perte en capital. Les conditions de marché
              peuvent être défavorables et le prix exécuté peut différer de l'indicatif affiché.
            </p>
          </div>

          {/* Confirmation */}
          {orderId ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#D6F7EF] border border-[#A3EDD9] text-[#007A63] text-[12px] font-semibold">
              <CheckCircle2 size={14} />
              Ordre {orderId} transmis. Confirmation attendue sous 2-3 jours ouvrés.
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button variant="muted" onClick={onClose} disabled={submitting}>
              {orderId ? 'Fermer' : 'Annuler'}
            </Button>
            {!orderId && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                loading={submitting}
                disabled={quantity <= 0 || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Transmission
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Confirmer la vente
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider font-bold text-ink-3">{label}</div>
      <div className="font-mono text-[13px] font-semibold text-ink">{value}</div>
    </div>
  );
}
