'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Mail, Globe } from 'lucide-react';
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

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-surface font-body">
      {/* Gradient Header Band */}
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
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-semibold tracking-wide text-white/90 uppercase">
              RGPD &amp; Confidentialit&eacute;
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Politique de confidentialit&eacute;
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Derni&egrave;re mise &agrave; jour : 15 avril 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <PageHeader
          icon={ShieldCheck}
          title="Engagement RGPD"
          subtitle="Transparence sur la collecte et le traitement de vos donn&eacute;es personnelles"
        />
        <JurisdictionNotice />
        <div className="prose-custom">
          <section className="mb-10">
            <p className="text-base text-ink-2 leading-relaxed mb-4">
              Strick&apos;in SAS (ci-apr&egrave;s &laquo;&nbsp;Strick&apos;in&nbsp;&raquo;) accorde la plus grande importance &agrave;
              la protection des donn&eacute;es &agrave; caract&egrave;re personnel de ses utilisateurs. La pr&eacute;sente
              politique de confidentialit&eacute; d&eacute;crit les modalit&eacute;s de collecte, de traitement,
              d&apos;utilisation et de conservation des donn&eacute;es personnelles dans le cadre de
              l&apos;utilisation de la plateforme Strick&apos;in, conform&eacute;ment au R&egrave;glement (UE) 2016/679
              (&laquo;&nbsp;RGPD&nbsp;&raquo;) et &agrave; la loi n&deg;78-17 du 6 janvier 1978 modifi&eacute;e dite &laquo;&nbsp;Informatique
              et Libert&eacute;s&nbsp;&raquo;.
            </p>
          </section>

          <Section title="Collecte des donn&eacute;es">
            <p>
              Strick&apos;in collecte deux cat&eacute;gories de donn&eacute;es&nbsp;: les donn&eacute;es communiqu&eacute;es
              directement par l&apos;utilisateur lors de la cr&eacute;ation de son compte et de l&apos;utilisation
              de la plateforme (identit&eacute;, coordonn&eacute;es professionnelles, num&eacute;ro ORIAS, statut
              r&eacute;glementaire, informations sur la structure distributrice) et les donn&eacute;es collect&eacute;es
              automatiquement (journaux de connexion, adresse IP, donn&eacute;es de navigation,
              identifiants techniques).
            </p>
            <p>
              Dans le cadre des op&eacute;rations de souscription et de pricing, Strick&apos;in peut &eacute;galement
              traiter des donn&eacute;es relatives aux clients finaux des distributeurs, agissant alors en
              qualit&eacute; de sous-traitant au sens de l&apos;article&nbsp;28 du RGPD, conform&eacute;ment aux accords
              de traitement conclus avec les responsables de traitement concern&eacute;s.
            </p>
            <p>
              La fourniture des donn&eacute;es marqu&eacute;es comme obligatoires lors de l&apos;inscription est
              n&eacute;cessaire &agrave; l&apos;ex&eacute;cution du contrat. &Agrave; d&eacute;faut, Strick&apos;in se trouvera dans
              l&apos;incapacit&eacute; de fournir les services sollicit&eacute;s.
            </p>
          </Section>

          <Section title="Finalit&eacute;s du traitement">
            <p>
              Les donn&eacute;es personnelles sont trait&eacute;es pour les finalit&eacute;s suivantes&nbsp;: gestion des
              comptes utilisateurs et authentification, ex&eacute;cution des services contractuels (pricing,
              RFQ, souscription), respect des obligations r&eacute;glementaires (lutte contre le blanchiment,
              connaissance du client professionnel, conformit&eacute; MIF&nbsp;II et DDA), am&eacute;lioration de la
              plateforme et analyse statistique, relation client et communication commerciale,
              pr&eacute;vention des fraudes et s&eacute;curit&eacute; du syst&egrave;me d&apos;information.
            </p>
            <p>
              Les bases l&eacute;gales de ces traitements sont respectivement&nbsp;: l&apos;ex&eacute;cution du contrat
              (article&nbsp;6.1.b RGPD), le respect d&apos;obligations l&eacute;gales (article&nbsp;6.1.c RGPD),
              l&apos;int&eacute;r&ecirc;t l&eacute;gitime de Strick&apos;in (article&nbsp;6.1.f RGPD) et, le cas &eacute;ch&eacute;ant, le
              consentement expr&egrave;s de la personne concern&eacute;e (article&nbsp;6.1.a RGPD).
            </p>
            <p>
              Strick&apos;in s&apos;engage &agrave; ne pas traiter les donn&eacute;es personnelles &agrave; des fins incompatibles
              avec les finalit&eacute;s initialement pr&eacute;sent&eacute;es et &agrave; ne pas proc&eacute;der &agrave; des prises de
              d&eacute;cision enti&egrave;rement automatis&eacute;es produisant des effets juridiques significatifs
              sans information pr&eacute;alable de la personne concern&eacute;e.
            </p>
          </Section>

          <Section title="Conservation des donn&eacute;es">
            <p>
              Les donn&eacute;es personnelles sont conserv&eacute;es pour la dur&eacute;e strictement n&eacute;cessaire aux
              finalit&eacute;s pour lesquelles elles ont &eacute;t&eacute; collect&eacute;es. &Agrave; titre indicatif, les donn&eacute;es
              relatives au compte utilisateur sont conserv&eacute;es pendant toute la dur&eacute;e de la
              relation contractuelle et jusqu&apos;&agrave; trois (3) ans apr&egrave;s la cl&ocirc;ture du compte, &agrave; des
              fins de prospection commerciale et de preuve.
            </p>
            <p>
              Les donn&eacute;es trait&eacute;es dans le cadre d&apos;obligations l&eacute;gales (comptabilit&eacute;,
              LCB-FT, archivage r&eacute;glementaire) sont conserv&eacute;es pendant les dur&eacute;es l&eacute;gales
              applicables, qui peuvent atteindre dix (10) ans pour les pi&egrave;ces comptables et cinq (5)
              ans &agrave; compter de la fin de la relation d&apos;affaires pour les documents LCB-FT,
              conform&eacute;ment &agrave; l&apos;article L.561-12 du Code mon&eacute;taire et financier.
            </p>
            <p>
              Les journaux de connexion sont conserv&eacute;s pendant une dur&eacute;e maximale d&apos;un (1) an,
              conform&eacute;ment aux obligations de conservation pr&eacute;vues par le d&eacute;cret
              n&deg;2011-219 du 25 f&eacute;vrier 2011.
            </p>
          </Section>

          <Section title="Destinataires des donn&eacute;es">
            <p>
              Les donn&eacute;es personnelles sont destin&eacute;es aux services habilit&eacute;s de Strick&apos;in SAS,
              ainsi qu&apos;&agrave; ses sous-traitants techniques (h&eacute;bergement, maintenance, supervision,
              messagerie). Ces derniers agissent sur instructions documentaires de Strick&apos;in et sont
              soumis &agrave; des engagements contractuels stricts en mati&egrave;re de confidentialit&eacute; et de
              s&eacute;curit&eacute;.
            </p>
            <p>
              Dans le cadre des services de pricing et de souscription, certaines donn&eacute;es peuvent
              &ecirc;tre transmises aux &eacute;metteurs partenaires (BNP Paribas, Goldman Sachs, Soci&eacute;t&eacute;
              G&eacute;n&eacute;rale, Natixis, Barclays, notamment), qui agissent en qualit&eacute; de responsables de
              traitement ind&eacute;pendants pour leurs propres finalit&eacute;s.
            </p>
            <p>
              Les donn&eacute;es peuvent &eacute;galement &ecirc;tre communiqu&eacute;es aux autorit&eacute;s de supervision et de
              contr&ocirc;le (ACPR, AMF, Tracfin, administration fiscale), en r&eacute;ponse &agrave; une demande
              l&eacute;gitime fond&eacute;e sur une base l&eacute;gale. Aucun transfert de donn&eacute;es n&apos;est effectu&eacute; vers
              un pays tiers hors Union europ&eacute;enne, sauf encadrement par les clauses contractuelles
              types de la Commission europ&eacute;enne ou tout autre m&eacute;canisme de transfert autoris&eacute;.
            </p>
          </Section>

          <Section title="Droits RGPD">
            <p>
              Conform&eacute;ment aux articles&nbsp;15 &agrave; 22 du RGPD, chaque personne concern&eacute;e dispose des
              droits suivants sur ses donn&eacute;es personnelles&nbsp;:
            </p>
            <ul className="list-none space-y-3 my-5 pl-0">
              <RightItem
                label="Droit d&apos;acc&egrave;s"
                description="Obtenir la confirmation que des donn&eacute;es vous concernant sont trait&eacute;es et en recevoir une copie."
              />
              <RightItem
                label="Droit de rectification"
                description="Faire corriger les donn&eacute;es inexactes ou incompl&egrave;tes vous concernant."
              />
              <RightItem
                label="Droit &agrave; l&apos;effacement"
                description="Demander la suppression de vos donn&eacute;es, sous r&eacute;serve des obligations l&eacute;gales de conservation."
              />
              <RightItem
                label="Droit &agrave; la portabilit&eacute;"
                description="R&eacute;cup&eacute;rer vos donn&eacute;es dans un format structur&eacute;, couramment utilis&eacute; et lisible par machine."
              />
              <RightItem
                label="Droit d&apos;opposition"
                description="Vous opposer au traitement de vos donn&eacute;es pour des motifs tenant &agrave; votre situation particuli&egrave;re."
              />
              <RightItem
                label="Droit &agrave; la limitation"
                description="Obtenir la restriction du traitement dans les cas pr&eacute;vus par le RGPD."
              />
            </ul>
            <p>
              Ces droits peuvent &ecirc;tre exerc&eacute;s &agrave; tout moment en adressant une demande, accompagn&eacute;e
              d&apos;un justificatif d&apos;identit&eacute;, au D&eacute;l&eacute;gu&eacute; &agrave; la Protection des Donn&eacute;es (DPO) de
              Strick&apos;in. En cas de r&eacute;ponse insatisfaisante, la personne concern&eacute;e dispose du droit
              d&apos;introduire une r&eacute;clamation aupr&egrave;s de la Commission Nationale de l&apos;Informatique et
              des Libert&eacute;s (CNIL, 3&nbsp;place de Fontenoy, 75007&nbsp;Paris, www.cnil.fr).
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              La plateforme Strick&apos;in utilise des cookies et traceurs afin d&apos;assurer le bon
              fonctionnement du service, de s&eacute;curiser les sessions utilisateurs et de produire
              des statistiques d&apos;usage anonymis&eacute;es. Les cookies strictement n&eacute;cessaires au
              fonctionnement de la plateforme ne requi&egrave;rent pas de consentement, conform&eacute;ment aux
              recommandations de la CNIL.
            </p>
            <p>
              Les cookies &agrave; finalit&eacute; de mesure d&apos;audience et d&apos;am&eacute;lioration du service sont
              d&eacute;pos&eacute;s uniquement apr&egrave;s recueil du consentement expr&egrave;s de l&apos;utilisateur, via le
              bandeau de consentement affich&eacute; lors de la premi&egrave;re visite. L&apos;utilisateur peut &agrave; tout
              moment retirer son consentement ou modifier ses pr&eacute;f&eacute;rences depuis la rubrique
              &laquo;&nbsp;G&eacute;rer mes cookies&nbsp;&raquo; du pied de page.
            </p>
            <p>
              La dur&eacute;e de vie des cookies n&apos;exc&egrave;de pas treize (13) mois, renouvelable uniquement
              apr&egrave;s recueil d&apos;un nouveau consentement. Le param&eacute;trage du navigateur permet
              &eacute;galement de bloquer l&apos;ensemble des cookies, &eacute;tant pr&eacute;cis&eacute; que cette configuration
              peut affecter la disponibilit&eacute; de certaines fonctionnalit&eacute;s.
            </p>
          </Section>

          <Section title="S&eacute;curit&eacute;">
            <p>
              Strick&apos;in met en &oelig;uvre des mesures techniques et organisationnelles appropri&eacute;es pour
              garantir un niveau de s&eacute;curit&eacute; adapt&eacute; au risque, conform&eacute;ment &agrave; l&apos;article&nbsp;32
              du RGPD. Les donn&eacute;es sont chiffr&eacute;es au repos (AES-256) et en transit (TLS&nbsp;1.3),
              h&eacute;berg&eacute;es exclusivement au sein de l&apos;Union europ&eacute;enne sur une infrastructure
              souveraine, et prot&eacute;g&eacute;es par une authentification forte &agrave; double facteur.
            </p>
            <p>
              Les acc&egrave;s aux donn&eacute;es sont strictement limit&eacute;s aux personnes habilit&eacute;es, selon le
              principe du moindre privil&egrave;ge. Une tra&ccedil;abilit&eacute; exhaustive des op&eacute;rations sensibles
              est assur&eacute;e, et des audits de s&eacute;curit&eacute; ind&eacute;pendants sont conduits annuellement,
              compl&eacute;t&eacute;s de tests d&apos;intrusion (pentests) trimestriels.
            </p>
            <p>
              En cas de violation de donn&eacute;es susceptible d&apos;engendrer un risque pour les droits et
              libert&eacute;s des personnes concern&eacute;es, Strick&apos;in notifie l&apos;incident &agrave; la CNIL dans un
              d&eacute;lai de soixante-douze (72) heures et informe, le cas &eacute;ch&eacute;ant, les personnes
              concern&eacute;es, conform&eacute;ment aux articles&nbsp;33 et 34 du RGPD.
            </p>
          </Section>

          <Section title="Contact DPO">
            <p>
              Strick&apos;in SAS a d&eacute;sign&eacute; un D&eacute;l&eacute;gu&eacute; &agrave; la Protection des Donn&eacute;es (DPO) charg&eacute; de
              veiller au respect des obligations en mati&egrave;re de protection des donn&eacute;es personnelles
              et de r&eacute;pondre aux sollicitations des personnes concern&eacute;es.
            </p>
            <div className="rounded-2xl border border-violet-pale bg-violet-ghost p-6 my-6">
              <p className="font-display text-sm font-bold text-ink mb-3 uppercase tracking-wide">
                Coordonn&eacute;es du DPO
              </p>
              <div className="space-y-2 text-[15px] text-ink-2">
                <p className="m-0">
                  <span className="font-semibold">Par courrier :</span> Strick&apos;in SAS &ndash; &Agrave; l&apos;attention du DPO &ndash; 12&nbsp;rue de la Paix, 75002&nbsp;Paris
                </p>
                <p className="m-0">
                  <span className="font-semibold">Par email :</span>{' '}
                  <a
                    href="mailto:dpo@strickin.com"
                    className="inline-flex items-center gap-1.5 text-violet hover:text-violet-dark font-semibold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    dpo@strickin.com
                  </a>
                </p>
              </div>
            </div>
            <p>
              Le DPO s&apos;engage &agrave; traiter toute demande dans un d&eacute;lai maximum d&apos;un (1) mois &agrave;
              compter de sa r&eacute;ception, prorogeable de deux (2) mois compte tenu de la complexit&eacute; ou
              du nombre de demandes. Une r&eacute;ponse motiv&eacute;e sera syst&eacute;matiquement apport&eacute;e, en
              fran&ccedil;ais, par le canal d&apos;&eacute;change privil&eacute;gi&eacute; par la personne concern&eacute;e.
            </p>
          </Section>
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
              <Link href="/cgu" className="hover:text-violet transition-colors">
                CGU
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 scroll-mt-24">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet to-teal" />
        <h2 className="font-display text-2xl md:text-[28px] font-bold text-ink leading-tight">
          {title}
        </h2>
      </div>
      <div className="pl-5 border-l-2 border-border-subtle space-y-4 text-[15px] text-ink-2 leading-[1.75]">
        {children}
      </div>
    </section>
  );
}

function RightItem({ label, description }: { label: string; description: string }) {
  return (
    <li className="flex gap-3 items-start list-none">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet shrink-0" />
      <div>
        <span className="font-display font-bold text-ink">{label}.&nbsp;</span>
        <span className="text-[15px] text-ink-2">{description}</span>
      </div>
    </li>
  );
}
