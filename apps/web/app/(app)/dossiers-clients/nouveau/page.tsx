'use client';

import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ClientWizard } from '@/components/dossiers/ClientWizard';

export default function NouveauDossierPage() {
  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader
        icon={FileText}
        title="Nouveau dossier client"
        subtitle="Suivez les 5 \u00e9tapes pour constituer le dossier et g\u00e9n\u00e9rer les documents r\u00e9glementaires."
      >
        <Button asChild variant="outline">
          <Link href="/dossiers-clients">
            <ArrowLeft size={14} />
            Retour \u00e0 la liste
          </Link>
        </Button>
      </PageHeader>

      <ClientWizard />
    </div>
  );
}
