'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileBarChart,
  Building2,
  Users,
  Coins,
  Target,
  ShieldAlert,
  PackageOpen,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { ReportCard } from '@/components/reporting/ReportCard';
import {
  aggregateClientTypology,
  computeTargetMarketCompliance,
  getRetrocessionsSummary,
  getVolumesSummary,
  listAMLIncidents,
} from '@/lib/reporting/aggregations';
import {
  generateAMLReport,
  generateClientTypologyReport,
  generateRetrocessionsReport,
  generateTargetMarketReport,
  generateVolumeReport,
} from '@/lib/reporting/amf-templates';

const YEARS = [2024, 2025, 2026] as const;
type Year = (typeof YEARS)[number];

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}

export default function ReportingAmfPage() {
  const { toasts, success, info, dismiss } = useToast();
  const [year, setYear] = useState<Year>(2026);
  const [lastGenerations, setLastGenerations] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    document.title = "Reporting AMF | Strick'in";
  }, []);

  // ── Summaries for cards ──────────────────────────────────────────────────
  const volumes = useMemo(() => getVolumesSummary(year), [year]);
  const typology = useMemo(() => aggregateClientTypology(year), [year]);
  const retros = useMemo(() => getRetrocessionsSummary(year), [year]);
  const tm = useMemo(() => computeTargetMarketCompliance(year), [year]);
  const aml = useMemo(() => listAMLIncidents(year), [year]);

  const tmMatchPct = tm.total > 0 ? ((tm.matched / tm.total) * 100).toFixed(1) : '0.0';
  const typologyTotal = typology.particuliers + typology.entreprises + typology.pro;

  // ── Report generators with tracking ─────────────────────────────────────
  const markGenerated = (key: string) => {
    setLastGenerations((prev) => ({ ...prev, [key]: new Date().toISOString() }));
  };

  const gen = {
    volumes: () => {
      markGenerated('volumes');
      return generateVolumeReport(year);
    },
    typology: () => {
      markGenerated('typology');
      return generateClientTypologyReport(year);
    },
    retros: () => {
      markGenerated('retros');
      return generateRetrocessionsReport(year);
    },
    tm: () => {
      markGenerated('tm');
      return generateTargetMarketReport(year);
    },
    aml: () => {
      markGenerated('aml');
      return generateAMLReport(year);
    },
  };

  // ── "Tout générer" : opens all reports sequentially in new tabs ──────────
  const handleGenerateAll = () => {
    const keys: Array<keyof typeof gen> = [
      'volumes',
      'typology',
      'retros',
      'tm',
      'aml',
    ];
    info(
      `Génération de ${keys.length} rapports — autorisez les pop-ups si besoin.`,
      { title: 'Export global' },
    );
    keys.forEach((k, idx) => {
      setTimeout(() => {
        const html = gen[k]();
        const w = window.open('', '_blank', 'noopener');
        if (w) {
          w.document.open();
          w.document.write(html);
          w.document.close();
        }
      }, idx * 350);
    });
    setTimeout(() => {
      success(
        'Les 5 rapports ont été préparés. Utilisez « Enregistrer en PDF » pour archiver.',
        { title: 'Export terminé' },
      );
    }, keys.length * 350 + 100);
  };

  const yearOptions = YEARS.map((y) => ({
    value: String(y),
    label: `Exercice ${y}`,
  }));

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          icon={FileBarChart}
          title="Reporting AMF / ACPR"
          subtitle="Rapports réglementaires consolidés — édition automatique des documents exigibles par les superviseurs."
        >
          <div className="min-w-[150px]">
            <Select
              value={String(year)}
              onChange={(v) => setYear(Number(v) as Year)}
              options={yearOptions}
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleGenerateAll}>
            <PackageOpen size={14} />
            Tout générer
          </Button>
        </PageHeader>

        {/* Regulatory summary bar */}
        <div
          className={cn(
            'mb-6 rounded-2xl border border-border/60',
            'bg-gradient-to-br from-[#3B1FA8]/[0.04] to-[#5B3FD4]/[0.02]',
            'p-5 flex items-center gap-4 flex-wrap',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] flex items-center justify-center shrink-0 shadow-md">
              <Package size={16} className="text-white" />
            </span>
            <div>
              <p className="font-display text-[13px] font-bold text-ink">
                Exercice {year}
              </p>
              <p className="text-[11px] text-ink-3 font-body">
                5 rapports réglementaires consolidés
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 flex-wrap text-[11px] font-body text-ink-3">
            <div>
              <span className="uppercase tracking-widest font-bold text-[9px]">
                AMF
              </span>
              <p className="text-ink">Volumes, rétrocessions, marché cible</p>
            </div>
            <div className="w-px h-7 bg-border/60" />
            <div>
              <span className="uppercase tracking-widest font-bold text-[9px]">
                ACPR
              </span>
              <p className="text-ink">Typologie, LCB-FT</p>
            </div>
          </div>
        </div>

        {/* Grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            id="volumes"
            title="Volumes distribués par émetteur"
            description="État annuel des volumes de produits structurés ventilés par émetteur partenaire."
            icon={Building2}
            accent="#3B1FA8"
            metricLabel="Volume global"
            metric={formatAmount(volumes.total)}
            metricSub={`${volumes.issuers} émetteurs · leader : ${volumes.leader?.name ?? '—'}`}
            lastGeneratedAt={lastGenerations.volumes ?? null}
            onGenerate={gen.volumes}
          />
          <ReportCard
            id="typology"
            title="Typologie des clients"
            description="Segmentation MIF II / DDA : particuliers, entreprises, professionnels."
            icon={Users}
            accent="#5B3FD4"
            metricLabel="Clients distribués"
            metric={formatNumber(typologyTotal)}
            metricSub={`${formatNumber(typology.particuliers)} particuliers · ${formatNumber(typology.entreprises)} entreprises · ${formatNumber(typology.pro)} pro`}
            lastGeneratedAt={lastGenerations.typology ?? null}
            onGenerate={gen.typology}
          />
          <ReportCard
            id="retros"
            title="Rétrocessions perçues"
            description="Rétrocessions (inducements) perçues par Strick'in dans le cadre de MIF II, détail par produit."
            icon={Coins}
            accent="#D4A017"
            metricLabel="Total perçu"
            metric={formatAmount(retros.total)}
            metricSub={`Taux moyen ${retros.avgRate.toFixed(2)} % · ${retros.products} produits`}
            lastGeneratedAt={lastGenerations.retros ?? null}
            onGenerate={gen.retros}
          />
          <ReportCard
            id="tm"
            title="Conformité marché cible"
            description="Analyse de la conformité des distributions avec le target market défini par les producteurs."
            icon={Target}
            accent="#00B894"
            metricLabel="Taux de conformité"
            metric={`${tmMatchPct} %`}
            metricSub={`${formatNumber(tm.matched)} conformes sur ${formatNumber(tm.total)} distributions`}
            lastGeneratedAt={lastGenerations.tm ?? null}
            onGenerate={gen.tm}
          />
          <ReportCard
            id="aml"
            title="Incidents LCB-FT"
            description="Recensement des incidents de lutte contre le blanchiment — déclaratif annuel ACPR."
            icon={ShieldAlert}
            accent="#E8334A"
            metricLabel="Incidents recensés"
            metric={String(aml.length)}
            metricSub={`${aml.filter((i) => i.resolved).length} clos · ${aml.filter((i) => !i.resolved).length} en cours`}
            lastGeneratedAt={lastGenerations.aml ?? null}
            onGenerate={gen.aml}
          />
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
