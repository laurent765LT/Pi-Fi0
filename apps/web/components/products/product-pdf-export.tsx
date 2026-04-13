'use client';

import { useRef, useCallback } from 'react';
import { Download, Printer, Zap, Shield, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductPdfExportProps {
  product: any;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtPct(val: number | null | undefined): string {
  if (val == null) return '—';
  return val.toFixed(1) + '%';
}

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const SRI_COLORS: Record<number, string> = {
  1: '#00B894', 2: '#00B894', 3: '#8BC34A', 4: '#D4A017', 5: '#FF9800', 6: '#E8334A', 7: '#B71C1C',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function ProductPdfExport({ product }: ProductPdfExportProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const el = printRef.current;
    if (!el) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${product.name} — Fiche Produit</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'DM Sans', sans-serif; color: #1A0A3E; padding: 32px; max-width: 800px; margin: auto; }
          h1, h2, h3, .display { font-family: 'Syne', sans-serif; }
          .mono { font-family: 'DM Mono', monospace; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3B1FA8; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { display: flex; align-items: center; gap: 8px; }
          .logo-icon { width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg, #3B1FA8, #5535C4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 12px; }
          .brand { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; }
          .brand-accent { color: #5535C4; }
          .date { font-size: 11px; color: #7B6FA0; }
          .title { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          .subtitle { font-size: 13px; color: #7B6FA0; margin-bottom: 20px; }
          .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
          .badge-type { background: #EDE8FF; color: #3B1FA8; }
          .badge-sri { color: white; padding: 2px 10px; }
          .grid { display: grid; gap: 12px; margin-bottom: 20px; }
          .grid-2 { grid-template-columns: 1fr 1fr; }
          .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
          .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
          .card { border: 1px solid #E8E4F0; border-radius: 8px; padding: 12px; }
          .card-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #7B6FA0; font-weight: 700; margin-bottom: 4px; }
          .card-value { font-size: 18px; font-weight: 800; font-family: 'Syne', sans-serif; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 13px; font-weight: 700; color: #3B1FA8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; border-bottom: 1px solid #EDE8FF; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #7B6FA0; padding: 6px 8px; border-bottom: 1px solid #E8E4F0; }
          td { padding: 6px 8px; border-bottom: 1px solid #F5F3F8; }
          .text-right { text-align: right; }
          .disclaimer { font-size: 9px; color: #A099B0; line-height: 1.5; margin-top: 24px; padding-top: 12px; border-top: 1px solid #E8E4F0; }
          @media print {
            body { padding: 20px; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body>
        ${el.innerHTML}
        <script>window.print(); window.onafterprint = () => window.close();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [product]);

  const p = product;
  const sri = p.sri ?? 3;
  const sriColor = SRI_COLORS[sri] ?? '#7B6FA0';

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
        <Printer size={13} />
        Fiche PDF
      </Button>

      {/* Hidden printable content */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            <span className="brand">Strick<span className="brand-accent">&lsquo;in</span></span>
          </div>
          <span className="date">Fiche produit générée le {fmtDate(new Date().toISOString())}</span>
        </div>

        <h1 className="title">{p.name}</h1>
        <div className="subtitle">
          {p.issuerName} — {p.isin ?? 'ISIN en attente'}
          &nbsp;&nbsp;
          <span className="badge badge-type">{PAYOFF_LABELS[p.payoffType] ?? p.payoffType}</span>
          &nbsp;
          <span className="badge badge-sri" style={{ backgroundColor: sriColor }}>SRI {sri}/7</span>
        </div>

        <div className="grid grid-4">
          <div className="card">
            <div className="card-label">Coupon indicatif</div>
            <div className="card-value" style={{ color: '#00B894' }}>{fmtPct(p.couponPct)}</div>
          </div>
          <div className="card">
            <div className="card-label">Barrière capital</div>
            <div className="card-value">{fmtPct(p.barrierCapPct)}</div>
          </div>
          <div className="card">
            <div className="card-label">Maturité</div>
            <div className="card-value" style={{ fontSize: '14px' }}>{p.maturityDate ? fmtDate(p.maturityDate) : '—'}</div>
          </div>
          <div className="card">
            <div className="card-label">Devise</div>
            <div className="card-value">{p.currency ?? 'EUR'}</div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Caractéristiques</div>
          <table>
            <tbody>
              <tr><td>Sous-jacent</td><td className="text-right mono">{p.underlyingName ?? '—'}</td></tr>
              <tr><td>Fréquence coupon</td><td className="text-right">{p.couponFrequency ?? 'Trimestriel'}</td></tr>
              <tr><td>Barrière coupon</td><td className="text-right mono">{fmtPct(p.couponBarrierPct ?? p.barrierCapPct)}</td></tr>
              <tr><td>Effet mémoire</td><td className="text-right">{p.couponMemory ? 'Oui' : 'Non'}</td></tr>
              <tr><td>Barrière autocall</td><td className="text-right mono">{fmtPct(p.autocallBarrierPct ?? 100)}</td></tr>
              <tr><td>Monitoring barrière</td><td className="text-right">{p.barrierMonitoring ?? 'Européenne'}</td></tr>
              <tr><td>Date de strike</td><td className="text-right">{p.strikeDate ? fmtDate(p.strikeDate) : '—'}</td></tr>
              <tr><td>Clôture étagère</td><td className="text-right">{p.shelfClosingDate ? fmtDate(p.shelfClosingDate) : '—'}</td></tr>
              <tr><td>Taille étagère</td><td className="text-right mono">{p.shelfSize ? fmt(p.shelfSize) : '—'}</td></tr>
              <tr><td>Remplissage</td><td className="text-right mono">{p.fillPct != null ? fmtPct(p.fillPct) : '—'}</td></tr>
            </tbody>
          </table>
        </div>

        {p.description && (
          <div className="section">
            <div className="section-title">Description</div>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#4A3F6B' }}>{p.description}</p>
          </div>
        )}

        <div className="disclaimer">
          <strong>Avertissement :</strong> Ce document est fourni à titre informatif uniquement et ne constitue pas une offre, une recommandation ou un conseil d'investissement.
          Les produits structurés comportent un risque de perte en capital partielle ou totale. Les performances passées ne préjugent pas des performances futures.
          Le SRI (Summary Risk Indicator) est calculé conformément au règlement PRIIPs. Avant toute souscription, consultez le Document d'Informations Clés (KID).
          <br/><br/>
          Document généré par Strick'in — Plateforme de distribution de produits structurés.
        </div>
      </div>
    </>
  );
}
