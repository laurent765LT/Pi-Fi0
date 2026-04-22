import type { Course, Lesson } from '@/stores/academy-store';

// ─── Course Catalog ──────────────────────────────────────────────────────────
// 6 realistic structured-products training courses covering fundamentals,
// PRIIPs, pricing, regulatory and KYC/AML — built for French CGPs.

export const COURSES: Course[] = [
  // ─── 1 · Fondamentaux ───────────────────────────────────────────────────────
  {
    id: 'course-fondamentaux',
    title: 'Fondamentaux des produits structurés',
    description:
      "Maîtrisez les briques essentielles des produits structurés : architecture (zéro-coupon + option), typologies de payoff, rôle du sous-jacent, barrières et cas d'usage. Parcours conçu pour les conseillers débutants souhaitant sécuriser leurs bases.",
    duration: 180,
    level: 'debutant',
    category: 'fondamentaux',
    certificate: true,
    lessons: [
      {
        id: 'l-fond-1',
        title: 'Introduction : qu\'est-ce qu\'un produit structuré ?',
        duration: 22,
        videoUrl: 'mock://academy/fondamentaux/intro',
        transcript:
          "Un produit structuré est un instrument financier complexe combinant une obligation zéro-coupon (brique de capital) et une composante optionnelle (brique de performance). L'émetteur assemble ces deux blocs pour offrir un profil rendement-risque spécifique, souvent conditionnel à la performance d'un sous-jacent.",
      },
      {
        id: 'l-fond-2',
        title: 'Architecture : zéro-coupon + option',
        duration: 28,
        videoUrl: 'mock://academy/fondamentaux/architecture',
        transcript:
          "Le zéro-coupon garantit le remboursement du capital à maturité (partiel ou total selon le produit). L'option, achetée avec la différence entre le nominal et le prix du ZC, porte la performance. Comprendre cette décomposition permet de lire un produit comme une somme de primes d'option.",
      },
      {
        id: 'l-fond-3',
        title: 'Les grandes familles de payoff',
        duration: 32,
        videoUrl: 'mock://academy/fondamentaux/payoffs',
        transcript:
          "Autocall Phoenix, Autocall Coupon, Capital Protégé, Note à Barrière, Taux Conditionnel : chaque famille répond à un scénario de marché et à un profil client distinct. Nous détaillons les mécanismes, les indicateurs de risque et les objectifs patrimoniaux associés.",
      },
      {
        id: 'l-fond-4',
        title: 'Sous-jacents : indices, actions, paniers',
        duration: 24,
        videoUrl: 'mock://academy/fondamentaux/sous-jacents',
        transcript:
          "Le choix du sous-jacent conditionne la volatilité, le coupon offert et le risque de barrière. Indices décrement, actions single stock, paniers WoF (worst-of) : chaque famille a ses avantages et ses pièges que le conseiller doit savoir expliquer.",
      },
      {
        id: 'l-fond-5',
        title: 'Barrières de protection et de rappel',
        duration: 26,
        videoUrl: 'mock://academy/fondamentaux/barrieres',
        transcript:
          "La barrière de protection (souvent 50 à 70 %) définit le seuil en dessous duquel le capital est exposé à la baisse du sous-jacent. La barrière de rappel (80-100 %) déclenche le remboursement anticipé. Comprendre leur interaction est clé pour évaluer le risque réel.",
      },
      {
        id: 'l-fond-6',
        title: 'Quiz de synthèse',
        duration: 18,
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: 'q1',
              text: "Un produit structuré est généralement composé de :",
              answers: [
                "D'actions et d'obligations classiques",
                "D'un zéro-coupon et d'une composante optionnelle",
                "De futures sur matières premières uniquement",
                "De parts d'OPCVM monétaire",
              ],
              correctIndex: 1,
              explanation:
                "L'émetteur combine un ZC pour le remboursement et une option (ou un portefeuille d'options) pour la performance.",
            },
            {
              id: 'q2',
              text: "Une barrière de protection à 60 % signifie :",
              answers: [
                "Un rendement plafonné à 60 %",
                "Un coupon garanti de 60 %",
                "Le capital est protégé tant que le sous-jacent n'a pas baissé de plus de 40 %",
                "Un rappel anticipé à 60 % du nominal",
              ],
              correctIndex: 2,
              explanation:
                "La barrière de protection se déclenche si le sous-jacent franchit le seuil à la baisse — ici, une baisse de plus de 40 % expose le capital.",
            },
            {
              id: 'q3',
              text: "Un autocall Phoenix se caractérise par :",
              answers: [
                "Un coupon versé uniquement à maturité",
                "Un remboursement anticipé conditionné à une barrière de rappel",
                "Une absence de sous-jacent",
                "Un capital totalement garanti",
              ],
              correctIndex: 1,
              explanation:
                "L'autocall Phoenix prévoit un remboursement automatique si le sous-jacent dépasse le seuil de rappel à une date d'observation.",
            },
            {
              id: 'q4',
              text: "Les indices décrement sont utilisés pour :",
              answers: [
                "Augmenter la volatilité",
                "Financer un coupon plus élevé via une prime fixe retirée",
                "Suivre la performance d'un pays émergent",
                "Réduire la fiscalité du produit",
              ],
              correctIndex: 1,
              explanation:
                "Un décrement fixe (ex. 50 pts) permet à l'émetteur de financer le coupon distribué, au prix d'une performance moindre du sous-jacent.",
            },
          ],
        },
      },
    ],
  },
  // ─── 2 · PRIIPs / DIC ──────────────────────────────────────────────────────
  {
    id: 'course-priips',
    title: "PRIIPs et DIC — Document d'Informations Clés",
    description:
      "Comprendre la réglementation PRIIPs, lire un DIC (KID), expliquer le SRI, les scénarios de performance et les coûts à vos clients. Obligatoire pour tout conseiller en produits structurés.",
    duration: 120,
    level: 'intermediaire',
    category: 'priips',
    certificate: true,
    lessons: [
      {
        id: 'l-priips-1',
        title: 'Le cadre réglementaire PRIIPs',
        duration: 26,
        videoUrl: 'mock://academy/priips/cadre',
        transcript:
          "Règlement UE 1286/2014, en vigueur depuis 2018 pour la plupart des produits et 2023 pour les OPCVM. Il impose un document standardisé, le KID (Key Information Document), à tout produit d'investissement packagé destiné aux investisseurs particuliers (PRIIP).",
      },
      {
        id: 'l-priips-2',
        title: "L'indicateur SRI et les scénarios",
        duration: 32,
        videoUrl: 'mock://academy/priips/sri',
        transcript:
          "Le SRI (Summary Risk Indicator) combine risque de marché et risque de crédit sur une échelle de 1 à 7. Les scénarios de performance (défavorable, intermédiaire, favorable, stress) sont calculés sur la base d'une méthode réglementaire fondée sur l'historique ou la simulation.",
      },
      {
        id: 'l-priips-3',
        title: 'Les coûts : RIY et structure de frais',
        duration: 30,
        videoUrl: 'mock://academy/priips/couts',
        transcript:
          "Le Reduction in Yield (RIY) agrège l'ensemble des coûts (entrée, gestion, transaction, performance) en impact sur le rendement annualisé. Savoir commenter le RIY avec un client est essentiel pour la transparence imposée par PRIIPs.",
      },
      {
        id: 'l-priips-4',
        title: 'Quiz PRIIPs',
        duration: 20,
        quiz: {
          passingScore: 75,
          questions: [
            {
              id: 'q1',
              text: "Le SRI est une échelle allant de :",
              answers: ['0 à 10', '1 à 7', '1 à 5', 'A à G'],
              correctIndex: 1,
              explanation:
                "L'échelle SRI PRIIPs est normalisée de 1 (risque faible) à 7 (risque très élevé).",
            },
            {
              id: 'q2',
              text: "Le KID doit être remis :",
              answers: [
                "Après la souscription uniquement",
                "Avant toute souscription, et au plus tard lors de la décision d'investissement",
                "Uniquement sur demande du client",
                "Une fois par an par email",
              ],
              correctIndex: 1,
              explanation:
                "Le KID doit être remis en temps utile avant que le client ne soit lié par un contrat d'achat du PRIIP.",
            },
            {
              id: 'q3',
              text: "Le RIY représente :",
              answers: [
                "Le rendement annualisé brut",
                "L'impact total des frais sur le rendement",
                "Le ratio d'information du fonds",
                "La rentabilité instantanée",
              ],
              correctIndex: 1,
              explanation:
                "Le Reduction in Yield agrège tous les coûts et exprime leur impact en points de base sur le rendement annualisé.",
            },
          ],
        },
      },
    ],
  },
  // ─── 3 · Autocalls et barrières ────────────────────────────────────────────
  {
    id: 'course-autocalls',
    title: 'Autocalls et barrières',
    description:
      "Approfondissement sur les structures autocallables : mécanique de rappel, types de barrière (européenne, américaine, daily), impact des indices décrement et stratégies de placement.",
    duration: 120,
    level: 'intermediaire',
    category: 'fondamentaux',
    certificate: true,
    lessons: [
      {
        id: 'l-auto-1',
        title: "Mécanique de l'autocall",
        duration: 24,
        videoUrl: 'mock://academy/autocalls/mecanique',
        transcript:
          "À chaque date d'observation, si le sous-jacent dépasse la barrière de rappel, le produit rembourse le capital initial augmenté du coupon (ou du gain cumulé). Sinon, on passe à l'observation suivante ou la maturité finale.",
      },
      {
        id: 'l-auto-2',
        title: 'Phoenix vs Athena vs Airbag',
        duration: 26,
        videoUrl: 'mock://academy/autocalls/types',
        transcript:
          "Phoenix verse un coupon mémoire à chaque observation si le sous-jacent est au-dessus de la barrière de coupon. Athena capitalise les coupons jusqu'au rappel. Airbag atténue la perte en cas de franchissement de barrière à maturité.",
      },
      {
        id: 'l-auto-3',
        title: 'Barrières européennes vs américaines',
        duration: 22,
        videoUrl: 'mock://academy/autocalls/barrieres',
        transcript:
          "Barrière européenne : observée uniquement à maturité (moins risquée pour le client). Barrière américaine ou daily : observée chaque jour de bourse (risque accru). Le type de barrière modifie fortement le profil risque/rendement.",
      },
      {
        id: 'l-auto-4',
        title: 'Indices décrement : opportunité ou piège ?',
        duration: 28,
        videoUrl: 'mock://academy/autocalls/decrement',
        transcript:
          "Les indices décrement (fixe ou proportionnel) retirent mécaniquement une prime, permettant de financer des coupons plus attractifs. Ils performent sur des marchés haussiers modérés mais peuvent devenir défavorables dans un marché baissier prolongé.",
      },
      {
        id: 'l-auto-5',
        title: 'Quiz Autocalls',
        duration: 20,
        quiz: {
          passingScore: 70,
          questions: [
            {
              id: 'q1',
              text: "Dans un Phoenix, le coupon mémoire signifie :",
              answers: [
                'Le coupon est versé à l\'ouverture du produit',
                'Les coupons manqués peuvent être rattrapés ultérieurement si la condition est remplie',
                'Le coupon est fixe pour toute la durée',
                'Il n\'y a pas de coupon avant maturité',
              ],
              correctIndex: 1,
              explanation:
                "La mécanique mémoire permet de rattraper les coupons manqués lors des observations où la condition est remplie après une période défavorable.",
            },
            {
              id: 'q2',
              text: "Une barrière daily européenne est :",
              answers: [
                'Observée à la clôture chaque jour',
                "Observée uniquement à la maturité finale",
                'Observée à chaque date anniversaire',
                'Jamais observée',
              ],
              correctIndex: 1,
              explanation:
                "La barrière européenne est uniquement observée à maturité — elle est moins risquée qu'une barrière américaine qui s'observe en continu.",
            },
            {
              id: 'q3',
              text: "Un indice décrement à 50 points :",
              answers: [
                'Ajoute 50 points de performance par an',
                'Retire 50 points fixes par an, finançant le coupon',
                'Limite la perte maximale à 50 points',
                'Double les dividendes',
              ],
              correctIndex: 1,
              explanation:
                "Le décrement est un coût structurel permettant de financer des coupons attractifs ; il pèse sur la performance long terme.",
            },
          ],
        },
      },
    ],
  },
  // ─── 4 · Greeks et pricing ─────────────────────────────────────────────────
  {
    id: 'course-pricing',
    title: 'Greeks et pricing',
    description:
      "Module avancé : Black-Scholes, modélisation de la volatilité, les Greeks (Delta, Gamma, Vega, Theta, Rho), pricing par Monte Carlo et sensibilités. Pour conseillers souhaitant comprendre ce que fait le trading desk.",
    duration: 180,
    level: 'avance',
    category: 'pricing',
    certificate: true,
    lessons: [
      {
        id: 'l-pric-1',
        title: 'Rappels de calcul stochastique et Black-Scholes',
        duration: 30,
        videoUrl: 'mock://academy/pricing/bs',
        transcript:
          "Le modèle Black-Scholes-Merton suppose un mouvement brownien géométrique du sous-jacent et une volatilité constante. Sa formule fermée pour les options vanilles reste la référence pédagogique, malgré ses limites.",
      },
      {
        id: 'l-pric-2',
        title: 'Volatilité implicite et surface de vol',
        duration: 28,
        videoUrl: 'mock://academy/pricing/vol',
        transcript:
          "La volatilité implicite, inversée du prix de marché, forme une surface dépendant du strike et de la maturité. Le smile et le skew trahissent les anticipations de stress à la baisse des opérateurs.",
      },
      {
        id: 'l-pric-3',
        title: 'Delta et Gamma',
        duration: 24,
        videoUrl: 'mock://academy/pricing/delta-gamma',
        transcript:
          "Le Delta mesure la sensibilité du prix de l'option à une variation unitaire du sous-jacent. Le Gamma, dérivée seconde, mesure la convexité du Delta. Les desks gèrent un book avec un delta-hedging continu et un suivi gamma.",
      },
      {
        id: 'l-pric-4',
        title: 'Vega, Theta, Rho',
        duration: 26,
        videoUrl: 'mock://academy/pricing/vega-theta-rho',
        transcript:
          "Vega = sensibilité à la volatilité ; Theta = érosion temporelle ; Rho = sensibilité aux taux. Un produit structuré est principalement short vega et short gamma — l'émetteur gagne quand les marchés restent calmes.",
      },
      {
        id: 'l-pric-5',
        title: 'Monte Carlo pour produits path-dependent',
        duration: 32,
        videoUrl: 'mock://academy/pricing/monte-carlo',
        transcript:
          "Les autocalls sont path-dependent : leur prix dépend de la trajectoire entière du sous-jacent. La simulation Monte Carlo, avec 100k à 1M de chemins, permet d'estimer le juste prix et les sensibilités.",
      },
      {
        id: 'l-pric-6',
        title: 'Construire une indication de prix',
        duration: 24,
        videoUrl: 'mock://academy/pricing/indication',
        transcript:
          "À partir d'un desk pricer, on obtient un coupon théorique. La marge commerciale, les coûts de couverture et les frais d'émission réduisent cette indication. Comprendre cet écart aide à négocier avec l'émetteur.",
      },
      {
        id: 'l-pric-7',
        title: 'Quiz Pricing',
        duration: 16,
        quiz: {
          passingScore: 75,
          questions: [
            {
              id: 'q1',
              text: 'Le Delta mesure :',
              answers: [
                "La sensibilité au temps",
                "La variation du prix par unité de sous-jacent",
                "La volatilité implicite",
                "Le coût du capital",
              ],
              correctIndex: 1,
              explanation:
                "Δ = ∂P/∂S. Il quantifie la sensibilité de première ordre du prix de l'option au prix spot.",
            },
            {
              id: 'q2',
              text: 'Un produit structuré vendu à un client est typiquement :',
              answers: [
                'Long vega pour l\'émetteur',
                'Short vega pour l\'émetteur',
                'Neutre vega',
                'Sans exposition à la vol',
              ],
              correctIndex: 1,
              explanation:
                "L'émetteur qui vend l'option est short vega : il perd quand la volatilité implicite monte.",
            },
            {
              id: 'q3',
              text: 'Monte Carlo est particulièrement utile pour :',
              answers: [
                'Des options vanilles européennes',
                'Des produits path-dependent comme les autocalls',
                'Des obligations zéro-coupon',
                "Des parts d'OPCVM",
              ],
              correctIndex: 1,
              explanation:
                "Les structures path-dependent nécessitent une simulation des trajectoires, domaine privilégié du Monte Carlo.",
            },
            {
              id: 'q4',
              text: 'Le Theta est généralement :',
              answers: ['Positif', 'Négatif', 'Nul', 'Variable'],
              correctIndex: 1,
              explanation:
                "L'érosion temporelle pénalise le porteur d'option long : Theta est négatif pour un long call/put.",
            },
          ],
        },
      },
    ],
  },
  // ─── 5 · MIF II / DDA ──────────────────────────────────────────────────────
  {
    id: 'course-mif2',
    title: 'Réglementaire MIF II / DDA',
    description:
      "Maîtriser la directive MIF II et ses implications pour la distribution de produits structurés : gouvernance produit, adéquation, target market, rétrocessions et reporting obligatoire. Inclut les spécificités de la DDA pour l'assurance-vie.",
    duration: 180,
    level: 'intermediaire',
    category: 'reglementaire',
    certificate: true,
    lessons: [
      {
        id: 'l-mif-1',
        title: 'Panorama MIF II et DDA',
        duration: 28,
        videoUrl: 'mock://academy/mif2/panorama',
        transcript:
          "MIF II (2014/65/UE) entrée en vigueur en 2018, complétée par la DDA (2016/97/UE) pour la distribution d'assurances. Ces textes réorganisent la chaîne distributeur-producteur, imposent le target market et renforcent la protection du client non-pro.",
      },
      {
        id: 'l-mif-2',
        title: 'Gouvernance produit et target market',
        duration: 30,
        videoUrl: 'mock://academy/mif2/target-market',
        transcript:
          "Le producteur définit un marché cible (client type, objectifs, tolérance au risque) et le distributeur doit s'assurer de son adéquation avec le client réel. Toute sortie du marché cible doit être documentée et justifiée.",
      },
      {
        id: 'l-mif-3',
        title: "Test d'adéquation et profil client",
        duration: 26,
        videoUrl: 'mock://academy/mif2/adequation',
        transcript:
          "Trois piliers : connaissance & expérience, situation financière, objectifs d'investissement. Un produit ne peut être recommandé que s'il est compatible sur les trois dimensions. La documentation est une pièce maîtresse du dossier conseil.",
      },
      {
        id: 'l-mif-4',
        title: 'Rétrocessions et transparence',
        duration: 28,
        videoUrl: 'mock://academy/mif2/retrocessions',
        transcript:
          "Les rétrocessions versées au distributeur ne sont autorisées que si elles améliorent la qualité du service rendu au client et sont pleinement divulguées. Elles doivent être explicitées dans le bilan annuel remis au client.",
      },
      {
        id: 'l-mif-5',
        title: 'Reporting AMF et documentation',
        duration: 30,
        videoUrl: 'mock://academy/mif2/reporting',
        transcript:
          "L'AMF attend un reporting périodique des volumes distribués, de la typologie clientèle, des incidents LCB-FT et de la conformité target market. Préparez vos process pour répondre rapidement à une revue de contrôle.",
      },
      {
        id: 'l-mif-6',
        title: 'Quiz MIF II / DDA',
        duration: 18,
        quiz: {
          passingScore: 75,
          questions: [
            {
              id: 'q1',
              text: "La notion de target market implique :",
              answers: [
                "Un ciblage marketing géographique",
                "La définition d'un client type par le producteur et sa vérification par le distributeur",
                "L'interdiction de distribuer à l'étranger",
                "Un prix cible pour le produit",
              ],
              correctIndex: 1,
              explanation:
                "Le target market est un pilier de la gouvernance produit MIF II : producteur et distributeur partagent la responsabilité d'une distribution adéquate.",
            },
            {
              id: 'q2',
              text: "Les rétrocessions sont autorisées si :",
              answers: [
                "Elles sont secrètes",
                "Elles améliorent la qualité du service et sont divulguées",
                "Elles sont inférieures à 10 %",
                "Elles sont versées en crypto",
              ],
              correctIndex: 1,
              explanation:
                "Articles 24 et 26 de MIF II — transparence et amélioration de la qualité sont les deux conditions cumulatives.",
            },
            {
              id: 'q3',
              text: "Le test d'adéquation porte sur :",
              answers: [
                "Le goût du client pour les assurances",
                "Connaissance, situation financière et objectifs",
                "Uniquement la tolérance au risque",
                "Le statut juridique du client",
              ],
              correctIndex: 1,
              explanation:
                "MIF II impose l'évaluation conjointe des trois piliers pour tout conseil en investissement.",
            },
          ],
        },
      },
    ],
  },
  // ─── 6 · LCB-FT et KYC ─────────────────────────────────────────────────────
  {
    id: 'course-lcb-ft',
    title: 'LCB-FT et KYC',
    description:
      "Lutte contre le blanchiment et le financement du terrorisme : obligations vigilance, profils à risque, gel des avoirs, déclaration TRACFIN. Module essentiel pour tout distributeur réglementé.",
    duration: 120,
    level: 'intermediaire',
    category: 'kyc',
    certificate: true,
    lessons: [
      {
        id: 'l-lcb-1',
        title: 'Cadre légal français et européen',
        duration: 26,
        videoUrl: 'mock://academy/lcb/cadre',
        transcript:
          "5e directive anti-blanchiment (UE 2018/843), Code monétaire et financier articles L.561-x. Les obligations vigilance se déclinent en vigilance standard, simplifiée (faible risque) et renforcée (PEP, pays à risque, transactions complexes).",
      },
      {
        id: 'l-lcb-2',
        title: 'KYC : identifier et vérifier',
        duration: 28,
        videoUrl: 'mock://academy/lcb/kyc',
        transcript:
          "Identification : nom, date de naissance, adresse, profession. Vérification : pièce d'identité, justificatif de domicile, source de fonds. Le KYC est un processus continu — toute modification significative du profil doit être revalidée.",
      },
      {
        id: 'l-lcb-3',
        title: 'PEP, bénéficiaire effectif, listes de sanctions',
        duration: 32,
        videoUrl: 'mock://academy/lcb/pep',
        transcript:
          "Les Personnes Politiquement Exposées (PEP) déclenchent une vigilance renforcée. Le bénéficiaire effectif doit être identifié pour toute personne morale (>25 % du capital ou contrôle). Les listes de sanctions (UE, OFAC, ONU) doivent être consultées en continu.",
      },
      {
        id: 'l-lcb-4',
        title: 'Quiz LCB-FT',
        duration: 20,
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              text: "La vigilance renforcée s'applique :",
              answers: [
                "Uniquement aux clients inconnus",
                "Aux PEP, pays à risque et opérations complexes",
                "À tous les clients retraités",
                "Aux clients entreprises uniquement",
              ],
              correctIndex: 1,
              explanation:
                "La vigilance renforcée (art. L.561-10 CMF) cible les cas à risque élevé prédéfinis par le régulateur.",
            },
            {
              id: 'q2',
              text: "Un bénéficiaire effectif est :",
              answers: [
                "Le gérant d'un fonds",
                "La personne physique détenant in fine la personne morale ou en ayant le contrôle",
                "Le client du conseiller",
                "L'émetteur du produit",
              ],
              correctIndex: 1,
              explanation:
                "Le bénéficiaire effectif est défini par le seuil de 25 % du capital ou des droits de vote, ou par un contrôle équivalent.",
            },
            {
              id: 'q3',
              text: "Une déclaration TRACFIN doit être faite :",
              answers: [
                "En cas de doute raisonnable de blanchiment ou de financement du terrorisme",
                "À chaque souscription supérieure à 10 000 €",
                "Une fois par an",
                "Jamais — c'est l'affaire du client",
              ],
              correctIndex: 0,
              explanation:
                "La DS (déclaration de soupçon) à TRACFIN est obligatoire dès qu'un doute raisonnable apparaît, sans attendre de seuil.",
            },
          ],
        },
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getLessonById(
  courseId: string,
  lessonId: string,
): { course: Course; lesson: Lesson; index: number } | null {
  const course = getCourseById(courseId);
  if (!course) return null;
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return null;
  return { course, lesson: course.lessons[index], index };
}

// Course total hours for filters display
export function getCourseTotalHours(course: Course): number {
  return course.duration / 60;
}
