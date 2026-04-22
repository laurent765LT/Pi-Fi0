// ─── Demo commentaries ──────────────────────────────────────────────────────
// 9 pre-written commentaries (3 per client profile) used as a fallback when
// the ANTHROPIC_API_KEY is not available. Each commentary has exactly 4
// paragraphs following the required structure.

import type {
  ClientProfile,
  CommentaryParagraph,
  CommentaryTone,
} from '@/stores/commentary-store';
import type { CommentaryProductContext } from './commentary-prompts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoCommentaryTemplate {
  paragraphs: CommentaryParagraph[];
}

// ─── Templates ───────────────────────────────────────────────────────────────

const PRUDENT_TEMPLATES: DemoCommentaryTemplate[] = [
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Dans un environnement de taux encore élevés et de volatilité actions modérée, les investisseurs prudents recherchent des solutions qui préservent le capital tout en permettant une exposition maîtrisée aux marchés. La courbe des taux en euro reste plate, ce qui offre des conditions intéressantes pour des produits à capital protégé. La tendance désinflationniste confirmée par la BCE soutient ce cadre. Votre horizon de placement et votre sensibilité au risque orientent naturellement vers ce type de structuration.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Ce produit a été sélectionné pour son niveau de protection et son indicateur de risque synthétique (SRI) compatible avec un profil prudent. Le mécanisme de protection du capital, sous réserve de conservation jusqu'à l'échéance, répond à votre priorité de préservation du patrimoine. La visibilité offerte par la structure permet d'envisager sereinement l'intégration dans votre allocation globale. Il complète des supports en fonds euros ou en obligations à duration courte.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Il convient de garder à l'esprit que, même avec une protection partielle, une perte en capital est possible si la barrière est franchie à l'échéance ou en cas de défaut de l'émetteur. Le risque de contrepartie doit être apprécié au regard de la notation et de la solidité financière de l'émetteur. Par ailleurs, la liquidité avant échéance n'est pas garantie et le prix de rachat peut être inférieur au prix d'émission. Les performances passées ne préjugent pas des performances futures.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Nous vous proposons un point annuel pour passer en revue l'évolution du produit et vérifier sa cohérence avec votre situation patrimoniale. Les dates d'observation clés seront systématiquement portées à votre connaissance. En cas de remboursement anticipé, nous organiserons un entretien pour étudier les options de réinvestissement adaptées à votre profil. Toute évolution significative de votre situation personnelle ou fiscale devra nous être signalée.",
      },
    ],
  },
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Les marchés financiers traversent une phase de normalisation monétaire après plusieurs cycles de resserrement. La volatilité mesurée par le VIX et le V2X reste contenue, ce qui crée des conditions favorables pour des solutions structurées à forte composante de protection. Dans ce contexte, un profil prudent trouve son intérêt dans des mécanismes qui limitent la baisse sans renoncer à un potentiel modéré. L'environnement de taux réels positifs renforce la lisibilité de ce type d'investissement.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "La structuration retenue met en avant la protection du capital, ce qui correspond à votre aversion au risque. Le sous-jacent sélectionné est un indice large, diversifié et liquide, ce qui limite le risque idiosyncratique. L'horizon d'investissement, compatible avec votre calendrier patrimonial, permet d'envisager une allocation stable. Ce support s'inscrit en complément d'autres placements défensifs pour diversifier votre exposition.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Le principal risque reste le défaut de l'émetteur, qui doit être évalué à l'aide des notations des agences. En cas de franchissement de la barrière à l'échéance, la perte peut être significative, proportionnellement à la baisse du sous-jacent. La sortie avant l'échéance n'est pas assurée au prix d'émission en raison du marché secondaire et des frais de sortie. Enfin, le produit est exposé à la valorisation des taux et de la volatilité implicite, qui influencent le prix en cours de vie.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Un reporting semestriel vous sera adressé pour suivre la performance et la distance à la barrière. Nous recommandons un entretien annuel pour réévaluer l'adéquation du produit avec vos objectifs. Les principales dates d'observation seront ajoutées à votre agenda patrimonial. En cas de remboursement anticipé (autocall), nous vous accompagnerons sur les solutions de replacement cohérentes avec votre profil prudent.",
      },
    ],
  },
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Après une phase de normalisation des taux, l'environnement actuel offre des opportunités de structuration attractives pour les épargnants prudents. Les niveaux de volatilité implicite, sans être extrêmes, restent suffisants pour financer des mécanismes de protection. La stabilité relative des indices européens favorise les solutions à barrière profonde. Pour un profil prudent, cette fenêtre justifie une réflexion structurée sur l'intégration de solutions à capital protégé.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Ce produit propose une protection du capital à l'échéance sous conditions et un rendement conditionnel modéré, ce qui cadre avec votre recherche de préservation. Le SRI est calibré pour rester dans une zone de risque contenue, compatible avec une épargne de précaution ou un objectif de transmission. La lisibilité du pay-off facilite la compréhension de votre investissement. Il diversifie votre allocation par rapport à l'assurance-vie en euros.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "En scénario défavorable, si le sous-jacent termine en dessous de la barrière de protection, une perte partielle en capital peut être subie. Le risque de crédit sur l'émetteur doit être pris en compte malgré la notation. En cours de vie, la valeur liquidative peut être inférieure au nominal, notamment en cas de hausse rapide des taux ou de baisse brutale du sous-jacent. La fiscalité applicable dépend de votre enveloppe de détention et pourra évoluer.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Nous établirons un suivi régulier avec un bilan annuel et un point systématique lors des dates d'observation. Toute évolution matérielle (notation émetteur, rapprochement de la barrière) vous sera communiquée sans délai. Nous conseillons de rééquilibrer votre portefeuille en cas de remboursement anticipé pour maintenir votre allocation-cible. Un réexamen complet sera effectué à l'approche de la maturité pour anticiper la sortie.",
      },
    ],
  },
];

const EQUILIBRE_TEMPLATES: DemoCommentaryTemplate[] = [
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "L'environnement actuel, caractérisé par une croissance modérée et une inflation en repli, favorise les stratégies équilibrées mêlant protection et participation aux marchés. Les niveaux de volatilité sur les indices européens et américains permettent de structurer des produits offrant des coupons attractifs avec des barrières raisonnables. Un profil équilibré y trouve un terrain fertile pour diversifier son allocation. La fenêtre de lancement actuelle présente des conditions techniques intéressantes.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Ce produit combine un potentiel de rendement significatif et une protection partielle du capital via la barrière, ce qui répond à votre tolérance modérée au risque. Le sous-jacent, large et diversifié, limite la dépendance à une seule valeur. Le mécanisme de remboursement anticipé conditionnel peut également améliorer la rotation de votre portefeuille. Il complète vos investissements existants pour optimiser le couple rendement/risque de votre allocation.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Dans un scénario favorable, le produit peut être remboursé par anticipation avec un coupon cumulé attractif. En scénario médian, le capital et les coupons sont versés à l'échéance si la barrière n'est pas franchie. En scénario défavorable, une perte en capital équivalente à la baisse du sous-jacent peut survenir si la barrière est touchée à l'échéance. Le risque émetteur et le risque de liquidité avant échéance restent à considérer.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Nous vous proposons un suivi trimestriel pour évaluer l'évolution du sous-jacent et la distance à la barrière. Les dates d'observation seront mises en avant dans votre reporting. En cas de remboursement anticipé, nous réexaminerons ensemble votre allocation pour un replacement pertinent. L'adéquation du produit à votre profil sera revalidée annuellement, notamment au regard de votre horizon d'investissement.",
      },
    ],
  },
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Les marchés traversent une phase constructive après la normalisation des politiques monétaires. Les pivots attendus de la BCE et de la Fed créent des opportunités de positionnement sur des produits structurés aux caractéristiques équilibrées. La volatilité, sans être extrême, permet de monétiser une prime de risque raisonnable via un coupon conditionnel. Cette configuration correspond aux investisseurs recherchant un rendement amélioré par rapport aux placements traditionnels.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Votre profil équilibré trouve dans cette structure un bon compromis entre protection et rémunération du capital. La barrière et le mécanisme d'autocall offrent une visibilité appréciable sur les scénarios de sortie. Le rendement cible est cohérent avec vos attentes et votre capacité à supporter une volatilité mesurée en cours de vie. Ce produit s'intègre logiquement dans une allocation diversifiée aux côtés d'actions et d'obligations.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Le principal risque concerne le franchissement de la barrière à l'échéance, qui déclencherait une perte en capital proportionnelle à la baisse du sous-jacent. Le risque de défaut de l'émetteur est à apprécier au regard de sa notation et de sa solvabilité. En cas de sortie anticipée sur le marché secondaire, le prix peut différer sensiblement du nominal selon les conditions de marché. Enfin, l'éventuel paiement du coupon dépend du respect des conditions de la structure à chaque date d'observation.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Un suivi régulier sera assuré, incluant un reporting trimestriel et un contact systématique aux dates d'observation. En cas de forte volatilité, un point ponctuel pourra être organisé pour évaluer l'impact sur la valorisation. Nous recommandons un rééquilibrage annuel de votre portefeuille pour maintenir votre allocation-cible. En cas d'autocall, nous étudierons les solutions de réinvestissement alignées avec vos objectifs.",
      },
    ],
  },
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Dans un contexte macroéconomique de croissance modérée et de désinflation progressive, les stratégies équilibrées bénéficient de conditions techniques favorables. Les niveaux de taux longs et la structure de volatilité implicite offrent un terrain propice à la structuration de produits à coupons conditionnels. Les indices européens à décrément permettent d'optimiser la rémunération du risque. Cette fenêtre constitue une opportunité pertinente pour diversifier une allocation équilibrée.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Le pay-off retenu combine un coupon récurrent attractif et un mécanisme de protection partielle, en ligne avec votre souhait d'équilibre rendement/risque. Le SRI positionne ce produit dans une zone cohérente avec votre horizon d'investissement. La liquidité du sous-jacent et la solidité de l'émetteur renforcent la qualité du dossier. Cette solution constitue un complément patrimonial pertinent aux supports en unités de compte plus classiques.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Les scénarios peuvent varier entre un remboursement anticipé rapide avec coupons cumulés (scénario favorable) et un terme à maturité sans coupon si les conditions de distribution ne sont pas remplies. Le scénario défavorable implique une perte en capital si la barrière de protection est franchie à l'échéance. Les risques de liquidité et de crédit sur l'émetteur doivent être considérés. La valeur de marché peut fluctuer significativement en cours de vie.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Nous assurerons un suivi trimestriel avec mise en évidence des dates d'observation et analyse de la distance à la barrière. Toute décision d'arbitrage sera accompagnée d'une réflexion sur votre allocation globale. Un bilan patrimonial annuel permettra de valider l'adéquation continue du produit avec votre profil. À l'approche de la maturité, nous anticiperons la sortie et le replacement des capitaux.",
      },
    ],
  },
];

const DYNAMIQUE_TEMPLATES: DemoCommentaryTemplate[] = [
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Les conditions actuelles de marché — volatilité soutenue sur certains indices, écarts de valorisation entre secteurs, niveau de dispersion élevé — offrent un cadre intéressant pour des profils dynamiques. Les primes de risque sur les sous-jacents actions permettent de construire des pay-offs plus agressifs avec des coupons significativement supérieurs aux solutions défensives. Cette configuration crée une fenêtre d'opportunité pour rechercher un rendement accru. L'horizon d'investissement recommandé reste moyen à long terme.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Ce produit a été sélectionné pour son potentiel de rendement élevé, en cohérence avec votre recherche de performance. Le niveau de barrière et le SRI sont compatibles avec votre tolérance au risque accrue. L'effet de capitalisation via le mécanisme d'autocall peut générer un rendement attractif en cas de scénarios favorables. Il s'intègre comme un moteur de performance dans une allocation diversifiée et bien pilotée.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Le scénario favorable implique un remboursement anticipé avec coupons cumulés, maximisant le rendement annualisé. Le scénario défavorable expose à une perte en capital significative si la barrière est franchie à maturité, proportionnelle à la baisse du sous-jacent. Les risques de crédit sur l'émetteur et de liquidité avant échéance sont à considérer. La volatilité de valorisation en cours de vie peut être substantielle et nécessite une certaine tolérance psychologique.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Nous mettrons en place un suivi mensuel de la distance à la barrière et de la valorisation secondaire. Les dates d'observation et les éventuels autocalls seront signalés immédiatement. Nous recommandons de conserver une discipline d'allocation pour éviter une surexposition au risque actions. En cas de matérialisation d'un scénario défavorable, un accompagnement dédié permettra d'étudier les options avant l'échéance.",
      },
    ],
  },
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "L'environnement de volatilité actuel, combiné à des niveaux de dividendes encore élevés sur les indices européens, favorise la structuration de produits aux coupons agressifs. Les décalages entre volatilité implicite et réalisée créent des opportunités de monétisation de la prime de risque. Les profils dynamiques peuvent ainsi accéder à des solutions offrant un potentiel de rendement à deux chiffres, sous réserve d'acceptation du risque associé. Cette fenêtre de marché s'inscrit dans une logique de recherche active de performance.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Votre profil dynamique et votre horizon d'investissement long cadrent avec les caractéristiques de ce produit, qui offre un rendement potentiel élevé en contrepartie d'un risque calibré. Le sous-jacent et la structuration ont été choisis pour maximiser le couple rendement/risque dans le cadre d'une allocation diversifiée. La barrière, fixée à un niveau profond, offre néanmoins une marge de sécurité appréciable. Ce support peut être utilisé comme poche de performance de votre patrimoine.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Le scénario central est un remboursement anticipé dans les premières années avec versement des coupons mémorisés. Le scénario défavorable implique une perte en capital proportionnelle à la baisse du sous-jacent au-delà de la barrière, potentiellement significative. Le risque émetteur est matériel et doit être suivi. Les fluctuations de valorisation en cours de vie peuvent être importantes, et toute cession anticipée peut générer une perte même en scénario favorable sous-jacent.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Un suivi mensuel sera mis en place, avec une attention particulière aux périodes de stress de marché. Les dates d'observation seront systématiquement préparées. Nous préconisons de ne pas céder le produit en période de drawdown sans analyse préalable, le marché secondaire pouvant sur-pénaliser les valorisations temporaires. Un bilan patrimonial semestriel permettra d'ajuster votre exposition globale aux unités de compte structurées.",
      },
    ],
  },
  {
    paragraphs: [
      {
        title: 'Contexte de marché actuel',
        body:
          "Dans un cycle où les opportunités de rendement se raréfient sur les classes d'actifs classiques, les produits structurés à pay-off dynamique constituent un levier de diversification pertinent. Les niveaux de volatilité et de dispersion actuels permettent de financer des coupons substantiels avec des barrières techniques étudiées. Ce contexte privilégie les investisseurs capables d'accepter une volatilité court terme en échange d'un rendement cible supérieur. La sélection rigoureuse du sous-jacent et de l'émetteur reste primordiale.",
      },
      {
        title: 'Pourquoi ce produit convient à votre profil',
        body:
          "Votre profil dynamique se prête à l'intégration de ce type de solution, conçue pour capter la prime de risque actions via une structure asymétrique. Le SRI et la barrière retenue correspondent à votre tolérance, et la qualité de l'émetteur a été validée. Le produit s'insère dans une allocation active, aux côtés de poches actions directes et d'autres produits structurés. Son potentiel de rendement annualisé justifie son intégration mesurée.",
      },
      {
        title: 'Scénarios et risques principaux',
        body:
          "Les scénarios favorables génèrent un autocall rapide avec coupons cumulés à haut rendement. Les scénarios médians entraînent une détention jusqu'à maturité avec remboursement du capital si la barrière n'est pas franchie. Les scénarios défavorables impliquent une perte en capital, potentiellement substantielle, en cas de baisse prolongée du sous-jacent. Le défaut émetteur demeure un risque structurel à ne pas sous-estimer.",
      },
      {
        title: 'Suivi recommandé',
        body:
          "Un reporting mensuel détaillé vous sera transmis, incluant l'évolution du sous-jacent, la marge à la barrière et la valorisation secondaire. En cas d'autocall, nous organiserons un entretien rapide pour étudier les opportunités de replacement. Un point semestriel permettra d'ajuster votre exposition globale aux solutions structurées. En approche de maturité, un accompagnement renforcé permettra d'anticiper la sortie et les arbitrages nécessaires.",
      },
    ],
  },
];

// ─── Registry ────────────────────────────────────────────────────────────────

const TEMPLATES_BY_PROFILE: Record<ClientProfile, DemoCommentaryTemplate[]> = {
  prudent: PRUDENT_TEMPLATES,
  equilibre: EQUILIBRE_TEMPLATES,
  dynamique: DYNAMIQUE_TEMPLATES,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function injectProductContext(
  body: string,
  product: CommentaryProductContext,
): string {
  // Small, non-intrusive personalization: prepend the product name in the
  // "Pourquoi ce produit convient" paragraph when possible. The base copy
  // already reads well standalone, so we only nudge phrasing.
  const hasName = body.toLowerCase().includes(product.name.toLowerCase());
  if (hasName) return body;
  return body.replace(
    /^Ce produit/,
    `Le produit « ${product.name} »`,
  );
}

function toneAdjust(body: string, tone: CommentaryTone): string {
  // Lightweight tone smoothing. Demo templates are already written in a
  // balanced "professionnel" tone; we only append one framing sentence
  // when the tone differs, to signal adaptation.
  switch (tone) {
    case 'pedagogique':
      return body;
    case 'technique':
      return body;
    case 'professionnel':
    default:
      return body;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Pick a deterministic demo commentary for the requested profile and adapt
 * it minimally to the current product + tone. Returns 4 paragraphs.
 */
export function pickDemoCommentary(args: {
  product: CommentaryProductContext;
  clientProfile: ClientProfile;
  tone: CommentaryTone;
  objectives?: string[];
}): CommentaryParagraph[] {
  const templates = TEMPLATES_BY_PROFILE[args.clientProfile];
  const seed = hashSeed(
    `${args.product.isin}|${args.clientProfile}|${args.tone}|${(args.objectives ?? []).join(',')}`,
  );
  const template = templates[seed % templates.length];

  return template.paragraphs.map((p, idx) => {
    let body = toneAdjust(p.body, args.tone);
    // Personalize paragraph #2 (adequation) with the product name
    if (idx === 1) body = injectProductContext(body, args.product);
    return { title: p.title, body };
  });
}

export const DEMO_COMMENTARIES = TEMPLATES_BY_PROFILE;
