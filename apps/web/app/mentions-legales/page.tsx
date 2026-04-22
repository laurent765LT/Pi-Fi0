'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Globe } from 'lucide-react';
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

export default function MentionsLegalesPage() {
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
            <Building2 className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-semibold tracking-wide text-white/90 uppercase">
              Informations l&eacute;gales
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Mentions L&eacute;gales
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Derni&egrave;re mise &agrave; jour : 15 avril 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <PageHeader
          icon={Building2}
          title="Informations soci&eacute;t&eacute;"
          subtitle="&Eacute;diteur, h&eacute;bergement et agr&eacute;ments r&eacute;glementaires"
        />
        <JurisdictionNotice />
        <div className="prose-custom">
          <section className="mb-10">
            <p className="text-base text-ink-2 leading-relaxed mb-4">
              Conform&eacute;ment aux dispositions des articles&nbsp;6-III et 19 de la loi n&deg;2004-575 du
              21&nbsp;juin 2004 pour la confiance dans l&apos;&eacute;conomie num&eacute;rique, il est port&eacute; &agrave; la
              connaissance des utilisateurs et visiteurs du site Strick&apos;in les informations
              suivantes.
            </p>
          </section>

          <Section title="&Eacute;diteur du site">
            <div className="rounded-2xl border border-border bg-white p-6 mb-5">
              <dl className="grid sm:grid-cols-[180px_1fr] gap-y-3 gap-x-5 text-[15px]">
                <dt className="font-display font-bold text-ink">D&eacute;nomination sociale</dt>
                <dd className="text-ink-2 m-0">Strick&apos;in SAS</dd>

                <dt className="font-display font-bold text-ink">Forme juridique</dt>
                <dd className="text-ink-2 m-0">
                  Soci&eacute;t&eacute; par Actions Simplifi&eacute;e
                </dd>

                <dt className="font-display font-bold text-ink">Capital social</dt>
                <dd className="text-ink-2 m-0">500&nbsp;000&nbsp;&euro; enti&egrave;rement lib&eacute;r&eacute;</dd>

                <dt className="font-display font-bold text-ink">Si&egrave;ge social</dt>
                <dd className="text-ink-2 m-0">
                  12&nbsp;rue de la Paix
                  <br />
                  75002&nbsp;Paris &ndash; France
                </dd>

                <dt className="font-display font-bold text-ink">RCS</dt>
                <dd className="text-ink-2 m-0">Paris B&nbsp;912&nbsp;458&nbsp;307</dd>

                <dt className="font-display font-bold text-ink">SIRET</dt>
                <dd className="text-ink-2 m-0">912&nbsp;458&nbsp;307&nbsp;00015</dd>

                <dt className="font-display font-bold text-ink">Code APE / NAF</dt>
                <dd className="text-ink-2 m-0">6619Z &ndash; Autres activit&eacute;s auxiliaires de services financiers</dd>

                <dt className="font-display font-bold text-ink">TVA intracommunautaire</dt>
                <dd className="text-ink-2 m-0">FR&nbsp;82&nbsp;912&nbsp;458&nbsp;307</dd>

                <dt className="font-display font-bold text-ink">T&eacute;l&eacute;phone</dt>
                <dd className="text-ink-2 m-0">+33&nbsp;(0)1&nbsp;84&nbsp;80&nbsp;12&nbsp;48</dd>

                <dt className="font-display font-bold text-ink">Courriel</dt>
                <dd className="m-0">
                  <a
                    href="mailto:contact@strickin.com"
                    className="inline-flex items-center gap-1.5 text-violet hover:text-violet-dark font-semibold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    contact@strickin.com
                  </a>
                </dd>
              </dl>
            </div>
            <p>
              Strick&apos;in SAS est inscrite au Registre du Commerce et des Soci&eacute;t&eacute;s de Paris sous le
              num&eacute;ro indiqu&eacute; ci-dessus et exerce son activit&eacute; de plateforme num&eacute;rique de
              distribution de produits financiers structur&eacute;s &agrave; destination d&apos;une client&egrave;le
              exclusivement professionnelle.
            </p>
          </Section>

          <Section title="Directeur de publication">
            <p>
              Le Directeur de la publication du site est Monsieur Antoine Lef&egrave;vre, en sa qualit&eacute;
              de Pr&eacute;sident de Strick&apos;in SAS. Il peut &ecirc;tre contact&eacute; &agrave; l&apos;adresse
              publication@strickin.com ou par voie postale au si&egrave;ge social de la soci&eacute;t&eacute;.
            </p>
            <p>
              Le Directeur de publication est responsable du contenu &eacute;ditorial du site et veille au
              respect des obligations l&eacute;gales et d&eacute;ontologiques applicables, notamment en mati&egrave;re
              de communication relative aux produits financiers.
            </p>
          </Section>

          <Section title="H&eacute;bergement">
            <div className="rounded-2xl border border-border bg-white p-6 mb-5">
              <dl className="grid sm:grid-cols-[180px_1fr] gap-y-3 gap-x-5 text-[15px]">
                <dt className="font-display font-bold text-ink">H&eacute;bergeur</dt>
                <dd className="text-ink-2 m-0">Vercel Inc.</dd>

                <dt className="font-display font-bold text-ink">Adresse</dt>
                <dd className="text-ink-2 m-0">
                  340 S Lemon Ave #4133
                  <br />
                  Walnut, CA&nbsp;91789
                  <br />
                  &Eacute;tats-Unis d&apos;Am&eacute;rique
                </dd>

                <dt className="font-display font-bold text-ink">Site web</dt>
                <dd className="m-0">
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet hover:text-violet-dark font-semibold transition-colors"
                  >
                    vercel.com
                  </a>
                </dd>

                <dt className="font-display font-bold text-ink">R&eacute;gion de d&eacute;ploiement</dt>
                <dd className="text-ink-2 m-0">
                  Paris (CDG1) &ndash; France, Union europ&eacute;enne
                </dd>
              </dl>
            </div>
            <p>
              Les donn&eacute;es &agrave; caract&egrave;re personnel des utilisateurs sont h&eacute;berg&eacute;es exclusivement au
              sein de l&apos;Union europ&eacute;enne. Tout transfert de donn&eacute;es vers des serveurs situ&eacute;s hors
              UE est encadr&eacute; par les clauses contractuelles types adopt&eacute;es par la Commission
              europ&eacute;enne, conform&eacute;ment &agrave; la d&eacute;cision (UE) 2021/914.
            </p>
          </Section>

          <Section title="Agr&eacute;ments r&eacute;glementaires">
            <div className="rounded-2xl border border-violet-pale bg-violet-ghost p-6 mb-5">
              <dl className="grid sm:grid-cols-[220px_1fr] gap-y-3 gap-x-5 text-[15px]">
                <dt className="font-display font-bold text-ink">ORIAS</dt>
                <dd className="text-ink-2 m-0">
                  Immatriculation n&deg;&nbsp;23&nbsp;004&nbsp;812
                  <br />
                  <span className="text-ink-3 text-sm">
                    Organisme pour le Registre unique des Interm&eacute;diaires en Assurance, Banque et Finance
                  </span>
                </dd>

                <dt className="font-display font-bold text-ink">Cat&eacute;gories ORIAS</dt>
                <dd className="text-ink-2 m-0">
                  Courtier en Op&eacute;rations de Banque et Services de Paiement (COBSP)
                  <br />
                  Conseiller en Investissements Financiers (CIF)
                  <br />
                  Courtier d&apos;Assurance (COA)
                </dd>

                <dt className="font-display font-bold text-ink">Autorit&eacute; de contr&ocirc;le</dt>
                <dd className="text-ink-2 m-0">
                  ACPR &ndash; Autorit&eacute; de Contr&ocirc;le Prudentiel et de R&eacute;solution
                  <br />
                  4&nbsp;place de Budapest, CS&nbsp;92459, 75436&nbsp;Paris Cedex&nbsp;09
                  <br />
                  <a
                    href="https://acpr.banque-france.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet hover:text-violet-dark font-semibold transition-colors"
                  >
                    acpr.banque-france.fr
                  </a>
                </dd>

                <dt className="font-display font-bold text-ink">Association professionnelle</dt>
                <dd className="text-ink-2 m-0">
                  Strick&apos;in SAS est membre de la CNCGP (Chambre Nationale des Conseils en Gestion de
                  Patrimoine), association professionnelle agr&eacute;&eacute;e par l&apos;AMF.
                </dd>

                <dt className="font-display font-bold text-ink">V&eacute;rification</dt>
                <dd className="text-ink-2 m-0">
                  Le statut ORIAS est v&eacute;rifiable sur{' '}
                  <a
                    href="https://www.orias.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet hover:text-violet-dark font-semibold transition-colors"
                  >
                    www.orias.fr
                  </a>
                </dd>
              </dl>
            </div>
            <p>
              Strick&apos;in SAS dispose d&apos;une assurance de responsabilit&eacute; civile professionnelle et d&apos;une
              garantie financi&egrave;re conformes aux exigences des articles L.512-6 et L.512-7 du Code des
              assurances, souscrites aupr&egrave;s d&apos;une compagnie d&apos;assurance de premier rang.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative au site ou aux services propos&eacute;s par la Plateforme, les
              utilisateurs peuvent contacter Strick&apos;in SAS par les moyens suivants&nbsp;:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-violet mb-2">
                  Service client
                </p>
                <a
                  href="mailto:contact@strickin.com"
                  className="inline-flex items-center gap-1.5 text-violet hover:text-violet-dark font-semibold transition-colors text-[15px]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  contact@strickin.com
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-violet mb-2">
                  Support technique
                </p>
                <a
                  href="mailto:support@strickin.com"
                  className="inline-flex items-center gap-1.5 text-violet hover:text-violet-dark font-semibold transition-colors text-[15px]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  support@strickin.com
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-violet mb-2">
                  Protection des donn&eacute;es
                </p>
                <a
                  href="mailto:dpo@strickin.com"
                  className="inline-flex items-center gap-1.5 text-violet hover:text-violet-dark font-semibold transition-colors text-[15px]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  dpo@strickin.com
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-violet mb-2">
                  Presse &amp; partenariats
                </p>
                <a
                  href="mailto:press@strickin.com"
                  className="inline-flex items-center gap-1.5 text-violet hover:text-violet-dark font-semibold transition-colors text-[15px]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  press@strickin.com
                </a>
              </div>
            </div>
            <p>
              Le service client est joignable du lundi au vendredi, de 9&nbsp;h&nbsp;&agrave;
              19&nbsp;h&nbsp;(heure de Paris), hors jours f&eacute;ri&eacute;s. R&eacute;clamations et demandes
              &eacute;crites&nbsp;: 12&nbsp;rue de la Paix, 75002&nbsp;Paris, France.
            </p>
          </Section>

          <Section title="M&eacute;diation">
            <p>
              En cas de litige n&eacute; de l&apos;utilisation de la Plateforme, l&apos;utilisateur peut recourir
              gratuitement au service de m&eacute;diation comp&eacute;tent&nbsp;: le M&eacute;diateur de l&apos;AMF
              (17&nbsp;place de la Bourse, 75082&nbsp;Paris Cedex&nbsp;02) pour les litiges relatifs
              aux activit&eacute;s de conseil en investissements financiers, ou le M&eacute;diateur de
              l&apos;Assurance (TSA&nbsp;50110, 75441&nbsp;Paris Cedex&nbsp;09) pour les litiges relatifs
              aux activit&eacute;s de courtage en assurance.
            </p>
            <p>
              Ces dispositifs de m&eacute;diation sont accessibles apr&egrave;s qu&apos;une r&eacute;clamation pr&eacute;alable a
              &eacute;t&eacute; adress&eacute;e au service client de Strick&apos;in SAS et qu&apos;aucune solution satisfaisante
              n&apos;a &eacute;t&eacute; trouv&eacute;e dans un d&eacute;lai de deux (2) mois.
            </p>
          </Section>

          <Section title="Conception et r&eacute;alisation">
            <p>
              Le site Strick&apos;in a &eacute;t&eacute; con&ccedil;u, d&eacute;velopp&eacute; et est maintenu par les &eacute;quipes internes
              de Strick&apos;in SAS, avec l&apos;appui ponctuel de prestataires techniques sp&eacute;cialis&eacute;s dans
              le d&eacute;veloppement d&apos;applications financi&egrave;res et la cybers&eacute;curit&eacute;.
            </p>
            <p>
              Direction artistique, identit&eacute; visuelle et exp&eacute;rience utilisateur&nbsp;: studio interne
              Strick&apos;in Design System. Architecture technique&nbsp;: Next.js 14, TypeScript, Tailwind
              CSS. Infrastructure&nbsp;: Vercel Edge Network, conformit&eacute; SOC&nbsp;2 Type&nbsp;II.
            </p>
            <p>
              Toutes les marques et logos pr&eacute;sents sur le site sont la propri&eacute;t&eacute; de leurs
              titulaires respectifs. Les photographies, illustrations et &eacute;l&eacute;ments graphiques
              utilis&eacute;s sur le site sont soit la propri&eacute;t&eacute; exclusive de Strick&apos;in SAS, soit
              exploit&eacute;s sous licence d&ucirc;ment acquise.
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
              <Link href="/confidentialite" className="hover:text-violet transition-colors">
                Confidentialit&eacute;
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
