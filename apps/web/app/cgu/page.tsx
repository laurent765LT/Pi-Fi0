'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Globe } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useJurisdictionStore } from '@/stores/jurisdiction-store';
import { JURISDICTION_CONFIGS } from '@/lib/regulatory/jurisdiction-rules';

function JurisdictionNotice() {
  const current = useJurisdictionStore((s) => s.current);
  const cfg = JURISDICTION_CONFIGS[current];
  return (
    <div className="mb-8 rounded-xl border border-violet/20 bg-violet-pale/50 px-4 py-3 flex items-start gap-3">
      <Globe className="w-4 h-4 text-violet shrink-0 mt-0.5" />
      <div>
        <p className="font-body text-[12px] font-semibold text-violet leading-tight">
          Juridiction : {cfg.flag} {cfg.name} ({cfg.regulator})
        </p>
        <p className="font-body text-[11px] text-ink-3 leading-relaxed mt-0.5">
          Cette page couvre la juridiction <strong>{cfg.name}</strong>. Pour une autre
          juridiction, contactez votre gestionnaire.
        </p>
      </div>
    </div>
  );
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-surface font-body">
      {/* Gradient Hero Band */}
      <div className="relative overflow-hidden bg-gradient-violet">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-cobalt-light/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-violet-light/10 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 pt-10 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour &agrave; l&apos;accueil
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-6">
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-semibold tracking-wide text-white/90 uppercase">
              Document l&eacute;gal
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Conditions G&eacute;n&eacute;rales d&apos;Utilisation
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Derni&egrave;re mise &agrave; jour : 15 avril 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <PageHeader
          icon={FileText}
          title="Pr&eacute;ambule"
          subtitle="Cadre contractuel encadrant l&apos;acc&egrave;s &agrave; la plateforme Strick'in"
        />
        <JurisdictionNotice />
        <div className="prose-custom">
          <section className="mb-10">
            <p className="text-base text-ink-2 leading-relaxed mb-4">
              Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation (ci-apr&egrave;s &laquo;&nbsp;CGU&nbsp;&raquo;)
              r&eacute;gissent l&apos;acc&egrave;s et l&apos;utilisation de la plateforme num&eacute;rique Strick&apos;in
              (ci-apr&egrave;s &laquo;&nbsp;la Plateforme&nbsp;&raquo;), &eacute;dit&eacute;e par la soci&eacute;t&eacute; Strick&apos;in SAS,
              et destin&eacute;e aux professionnels de la distribution de produits structur&eacute;s.
              Tout acc&egrave;s ou utilisation de la Plateforme implique l&apos;acceptation sans r&eacute;serve des
              pr&eacute;sentes CGU.
            </p>
          </section>

          <Article number="1" title="Objet">
            <p>
              Les pr&eacute;sentes CGU ont pour objet de d&eacute;finir les modalit&eacute;s et conditions dans
              lesquelles Strick&apos;in SAS met &agrave; la disposition des Utilisateurs professionnels
              (Conseillers en Gestion de Patrimoine et Compagnies d&apos;Assurance) une plateforme
              num&eacute;rique permettant la consultation, la comparaison, la cotation (RFQ) et la
              souscription de produits financiers structur&eacute;s.
            </p>
            <p>
              La Plateforme constitue un outil technique destin&eacute; &agrave; faciliter la mise en relation
              entre &eacute;metteurs institutionnels et distributeurs professionnels agr&eacute;&eacute;s. Elle ne
              constitue en aucun cas un conseil en investissement ni une recommandation personnalis&eacute;e
              au sens de la directive MIF&nbsp;II.
            </p>
            <p>
              Les pr&eacute;sentes CGU s&apos;appliquent &agrave; l&apos;exclusion de tout autre document, sous r&eacute;serve
              des accords-cadres sp&eacute;cifiques conclus entre Strick&apos;in SAS et certains Utilisateurs
              institutionnels.
            </p>
          </Article>

          <Article number="2" title="Acceptation des CGU">
            <p>
              L&apos;acceptation des pr&eacute;sentes CGU est mat&eacute;rialis&eacute;e par la cr&eacute;ation d&apos;un compte
              utilisateur sur la Plateforme. L&apos;Utilisateur reconna&icirc;t avoir pris connaissance des CGU
              et les accepter express&eacute;ment et sans r&eacute;serve lors de son inscription.
            </p>
            <p>
              Strick&apos;in SAS se r&eacute;serve le droit de modifier les pr&eacute;sentes CGU &agrave; tout moment afin
              de les adapter &agrave; l&apos;&eacute;volution de la Plateforme, des obligations l&eacute;gales ou
              r&eacute;glementaires. Les Utilisateurs seront inform&eacute;s par courrier &eacute;lectronique de toute
              modification substantielle au moins trente (30) jours avant son entr&eacute;e en vigueur.
            </p>
            <p>
              La poursuite de l&apos;utilisation de la Plateforme apr&egrave;s notification des modifications
              vaut acceptation des nouvelles CGU. En cas de d&eacute;saccord, l&apos;Utilisateur dispose de la
              facult&eacute; de r&eacute;silier son compte dans les conditions pr&eacute;vues &agrave; l&apos;Article&nbsp;9.
            </p>
          </Article>

          <Article number="3" title="Description du service">
            <p>
              La Plateforme Strick&apos;in propose aux Utilisateurs un ensemble de services digitalis&eacute;s
              comprenant notamment&nbsp;: la consultation d&apos;un catalogue de produits structur&eacute;s
              (autocalls, phoenix, reverse convertibles, produits &agrave; capital garanti), un moteur de
              pricing en temps r&eacute;el aliment&eacute; par des donn&eacute;es de march&eacute; live, un syst&egrave;me de
              demandes de cotation multi-&eacute;metteurs (RFQ) et un tableau de bord de suivi de portefeuille.
            </p>
            <p>
              Strick&apos;in SAS agit en qualit&eacute; de prestataire technique. Les prix, caract&eacute;ristiques
              et conditions des produits affich&eacute;s sur la Plateforme sont communiqu&eacute;s par les
              &eacute;metteurs partenaires et rel&egrave;vent de leur seule responsabilit&eacute;. Strick&apos;in SAS ne
              saurait &ecirc;tre tenue responsable de l&apos;exactitude ou de la compl&eacute;tude de ces informations.
            </p>
            <p>
              L&apos;acc&egrave;s &agrave; la Plateforme est assur&eacute; vingt-quatre heures sur vingt-quatre, sept jours
              sur sept, sous r&eacute;serve des op&eacute;rations de maintenance, des incidents techniques et des
              cas de force majeure.
            </p>
          </Article>

          <Article number="4" title="Acc&egrave;s au service (CGP et Assureurs)">
            <p>
              L&apos;acc&egrave;s &agrave; la Plateforme est strictement r&eacute;serv&eacute; aux professionnels disposant des
              agr&eacute;ments r&eacute;glementaires n&eacute;cessaires &agrave; l&apos;exercice de leur activit&eacute;&nbsp;: Conseillers
              en Investissements Financiers (CIF) immatricul&eacute;s &agrave; l&apos;ORIAS, courtiers en assurance,
              entreprises d&apos;assurance et de r&eacute;assurance agr&eacute;&eacute;es par l&apos;ACPR, ou tout autre
              professionnel habilit&eacute; au sens du Code mon&eacute;taire et financier.
            </p>
            <p>
              L&apos;Utilisateur garantit que les informations fournies lors de son inscription sont
              exactes, sinc&egrave;res et &agrave; jour. Il s&apos;engage &agrave; informer Strick&apos;in SAS sans d&eacute;lai de
              toute modification susceptible d&apos;affecter son statut r&eacute;glementaire, notamment en cas
              de retrait d&apos;agr&eacute;ment, de radiation ou de suspension.
            </p>
            <p>
              Strick&apos;in SAS se r&eacute;serve la facult&eacute; de v&eacute;rifier &agrave; tout moment la validit&eacute; des
              agr&eacute;ments de l&apos;Utilisateur et de suspendre ou r&eacute;silier l&apos;acc&egrave;s &agrave; la Plateforme en
              cas d&apos;inexactitude des d&eacute;clarations ou de non-conformit&eacute; aux exigences r&eacute;glementaires
              applicables.
            </p>
          </Article>

          <Article number="5" title="Obligations de l&apos;utilisateur">
            <p>
              L&apos;Utilisateur s&apos;engage &agrave; utiliser la Plateforme conform&eacute;ment &agrave; sa destination
              professionnelle, dans le respect des lois et r&egrave;glements applicables, notamment la
              directive MIF&nbsp;II, la directive DDA, le R&egrave;glement PRIIPs et les obligations de
              lutte contre le blanchiment des capitaux et le financement du terrorisme (LCB-FT).
            </p>
            <p>
              L&apos;Utilisateur est seul responsable de la confidentialit&eacute; de ses identifiants de
              connexion. Toute op&eacute;ration effectu&eacute;e depuis son compte est r&eacute;put&eacute;e avoir &eacute;t&eacute;
              r&eacute;alis&eacute;e par lui. En cas de suspicion de compromission, l&apos;Utilisateur doit en informer
              imm&eacute;diatement Strick&apos;in SAS afin de proc&eacute;der &agrave; la r&eacute;vocation des acc&egrave;s.
            </p>
            <p>
              L&apos;Utilisateur s&apos;interdit toute utilisation frauduleuse, malveillante ou non conforme de
              la Plateforme, notamment&nbsp;: l&apos;extraction automatis&eacute;e de donn&eacute;es, l&apos;atteinte &agrave;
              l&apos;int&eacute;grit&eacute; du service, le partage d&apos;acc&egrave;s avec un tiers non autoris&eacute;, ou toute
              tentative de contournement des dispositifs de s&eacute;curit&eacute;.
            </p>
          </Article>

          <Article number="6" title="Propri&eacute;t&eacute; intellectuelle">
            <p>
              L&apos;ensemble des &eacute;l&eacute;ments composant la Plateforme (marques, logos, textes, graphismes,
              interfaces, bases de donn&eacute;es, codes sources, algorithmes de pricing) sont la propri&eacute;t&eacute;
              exclusive de Strick&apos;in SAS ou de ses partenaires et sont prot&eacute;g&eacute;s par le droit
              fran&ccedil;ais et international de la propri&eacute;t&eacute; intellectuelle.
            </p>
            <p>
              Strick&apos;in SAS conc&egrave;de &agrave; l&apos;Utilisateur un droit d&apos;usage personnel, non exclusif, non
              cessible et non transf&eacute;rable sur la Plateforme, strictement limit&eacute; &agrave; ses besoins
              professionnels et pour la dur&eacute;e de son inscription.
            </p>
            <p>
              Toute reproduction, repr&eacute;sentation, modification, extraction ou exploitation, totale
              ou partielle, de la Plateforme ou de son contenu, par quelque proc&eacute;d&eacute; que ce soit, sans
              l&apos;autorisation &eacute;crite pr&eacute;alable de Strick&apos;in SAS, est strictement interdite et
              constitue une contrefa&ccedil;on sanctionn&eacute;e par les articles L.335-2 et suivants du Code de
              la propri&eacute;t&eacute; intellectuelle.
            </p>
          </Article>

          <Article number="7" title="Responsabilit&eacute;">
            <p>
              Strick&apos;in SAS agit en qualit&eacute; de prestataire technique et s&apos;engage &agrave; d&eacute;ployer les
              moyens raisonnables pour garantir la disponibilit&eacute; et la fiabilit&eacute; de la Plateforme.
              Toutefois, la responsabilit&eacute; de Strick&apos;in SAS ne saurait &ecirc;tre engag&eacute;e en cas
              d&apos;interruption de service r&eacute;sultant d&apos;un cas de force majeure, d&apos;une intervention de
              maintenance ou d&apos;un dysfonctionnement imputable &agrave; un tiers.
            </p>
            <p>
              Strick&apos;in SAS ne d&eacute;livre aucun conseil en investissement et n&apos;&eacute;met aucune
              recommandation personnalis&eacute;e. Les d&eacute;cisions d&apos;investissement rel&egrave;vent de la seule
              responsabilit&eacute; de l&apos;Utilisateur professionnel, qui doit proc&eacute;der &agrave; ses propres
              analyses de risques et au respect de ses obligations au titre du devoir de conseil
              envers ses clients finaux.
            </p>
            <p>
              En tout &eacute;tat de cause, la responsabilit&eacute; cumul&eacute;e de Strick&apos;in SAS au titre des
              pr&eacute;sentes est limit&eacute;e au montant des sommes effectivement vers&eacute;es par l&apos;Utilisateur
              au cours des douze (12) mois pr&eacute;c&eacute;dant le fait g&eacute;n&eacute;rateur de responsabilit&eacute;, &agrave;
              l&apos;exclusion des dommages indirects.
            </p>
          </Article>

          <Article number="8" title="Protection des donn&eacute;es personnelles">
            <p>
              Strick&apos;in SAS agit en qualit&eacute; de responsable de traitement des donn&eacute;es personnelles
              collect&eacute;es dans le cadre de l&apos;utilisation de la Plateforme. Les traitements sont
              effectu&eacute;s dans le respect du R&egrave;glement (UE) 2016/679 (RGPD) et de la loi
              Informatique et Libert&eacute;s modifi&eacute;e.
            </p>
            <p>
              Les modalit&eacute;s de collecte, de traitement, de conservation et de communication des
              donn&eacute;es personnelles, ainsi que les droits dont disposent les personnes concern&eacute;es,
              sont d&eacute;taill&eacute;es dans la Politique de confidentialit&eacute;, accessible depuis la Plateforme
              et faisant partie int&eacute;grante des pr&eacute;sentes CGU.
            </p>
            <p>
              L&apos;Utilisateur s&apos;engage, lorsqu&apos;il t&eacute;l&eacute;verse ou traite des donn&eacute;es relatives &agrave; ses
              clients finaux via la Plateforme, &agrave; respecter l&apos;ensemble des obligations qui lui
              incombent en sa qualit&eacute; de responsable de traitement ou de sous-traitant, selon le cas.
            </p>
          </Article>

          <Article number="9" title="R&eacute;siliation">
            <p>
              L&apos;Utilisateur peut r&eacute;silier son compte &agrave; tout moment, sans motif, par demande adress&eacute;e
              &agrave; l&apos;adresse &eacute;lectronique support@strickin.com ou directement depuis l&apos;espace
              param&egrave;tres de son compte. La r&eacute;siliation prend effet &agrave; l&apos;issue d&apos;un pr&eacute;avis de
              trente (30) jours.
            </p>
            <p>
              Strick&apos;in SAS se r&eacute;serve le droit de suspendre ou r&eacute;silier l&apos;acc&egrave;s &agrave; la Plateforme,
              de plein droit et sans mise en demeure pr&eacute;alable, en cas de manquement grave de
              l&apos;Utilisateur &agrave; ses obligations contractuelles, r&eacute;glementaires ou l&eacute;gales, ou en cas
              de suspicion de fraude ou d&apos;atteinte &agrave; la s&eacute;curit&eacute; du service.
            </p>
            <p>
              La r&eacute;siliation entra&icirc;ne la cl&ocirc;ture du compte et la cessation imm&eacute;diate du droit
              d&apos;usage de la Plateforme. Les donn&eacute;es personnelles et professionnelles de l&apos;Utilisateur
              seront conserv&eacute;es ou supprim&eacute;es conform&eacute;ment aux dispositions de la Politique de
              confidentialit&eacute; et aux obligations l&eacute;gales applicables en mati&egrave;re d&apos;archivage.
            </p>
          </Article>

          <Article number="10" title="Droit applicable et juridiction comp&eacute;tente">
            <p>
              Les pr&eacute;sentes CGU sont soumises au droit fran&ccedil;ais. Elles sont r&eacute;dig&eacute;es en langue
              fran&ccedil;aise, seule version faisant foi en cas de litige, nonobstant toute traduction
              dans une autre langue.
            </p>
            <p>
              Tout diff&eacute;rend relatif &agrave; la formation, &agrave; l&apos;interpr&eacute;tation ou &agrave; l&apos;ex&eacute;cution des
              pr&eacute;sentes CGU fera l&apos;objet d&apos;une tentative de r&eacute;solution amiable entre les parties.
              &Agrave; d&eacute;faut d&apos;accord dans un d&eacute;lai de soixante (60) jours, le litige sera port&eacute; devant
              les juridictions comp&eacute;tentes du ressort de la Cour d&apos;appel de Paris, nonobstant
              pluralit&eacute; de d&eacute;fendeurs ou appel en garantie.
            </p>
            <p>
              Conform&eacute;ment aux dispositions du R&egrave;glement (UE) n&deg;524/2013, les Utilisateurs
              professionnels peuvent recourir &agrave; la plateforme europ&eacute;enne de r&egrave;glement en ligne
              des litiges, tout en pr&eacute;cisant que celle-ci est principalement destin&eacute;e aux
              consommateurs et non aux relations B2B.
            </p>
          </Article>
        </div>

        {/* Footer navigation */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-violet hover:text-violet-dark font-semibold transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour &agrave; l&apos;accueil
            </Link>
            <div className="flex items-center gap-6 text-sm text-ink-3">
              <Link href="/confidentialite" className="hover:text-violet transition-colors">
                Politique de confidentialit&eacute;
              </Link>
              <Link href="/mentions-legales" className="hover:text-violet transition-colors">
                Mentions l&eacute;gales
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Article({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12 scroll-mt-24" id={`article-${number}`}>
      <div className="flex items-baseline gap-3 mb-5">
        <span className="font-display text-xs font-bold uppercase tracking-[0.18em] text-violet">
          Article {number}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-violet/30 via-teal/20 to-transparent" />
      </div>
      <h2 className="font-display text-2xl md:text-[28px] font-bold text-ink leading-tight mb-5">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] text-ink-2 leading-[1.75]">
        {children}
      </div>
    </section>
  );
}
