// ─────────────────────────────────────────────────────────────
// Legal content (FR). Templates — À FAIRE RELIRE PAR UN JURISTE
// avant tout lancement. Le point critique pour un produit lié au
// trading est l'avertissement sur les risques.
// ─────────────────────────────────────────────────────────────

export interface LegalDoc {
  slug: string;
  title: string;
  updated: string;
  intro?: string;
  sections: { h: string; body: string[] }[];
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  risques: {
    slug: "risques",
    title: "Avertissement sur les risques",
    updated: "Août 2026",
    intro:
      "Veuillez lire attentivement cet avertissement avant d'utiliser VISITRADE. En utilisant le service, vous reconnaissez en avoir pris connaissance et l'accepter.",
    sections: [
      {
        h: "Outil d'aide à la décision, pas de conseil",
        body: [
          "VISITRADE est un outil d'analyse et d'aide à la décision. Les analyses, scénarios, statistiques et réponses de l'assistant IA sont fournis à titre purement informatif et pédagogique.",
          "Aucune information diffusée par VISITRADE ne constitue un conseil en investissement, une recommandation personnalisée, une incitation ou une sollicitation à acheter, vendre ou détenir un quelconque instrument financier.",
        ],
      },
      {
        h: "Risque de perte en capital",
        body: [
          "Le trading et l'investissement comportent un risque élevé de perte, pouvant aller jusqu'à la totalité du capital engagé, voire au-delà pour les produits à effet de levier.",
          "Les performances passées ne préjugent en aucun cas des performances futures. Aucune analyse ne garantit un résultat.",
        ],
      },
      {
        h: "Aucune garantie",
        body: [
          "VISITRADE ne promet aucun gain et ne prétend pas prédire l'évolution des marchés avec certitude. Les scénarios présentés sont des hypothèses, assorties de conditions et de seuils d'invalidation.",
          "Les données de marché peuvent comporter des erreurs, des retards ou des interruptions. Vérifiez toujours les informations auprès de sources officielles avant toute décision.",
        ],
      },
      {
        h: "Votre responsabilité",
        body: [
          "Vous êtes seul responsable de vos décisions d'investissement et de leurs conséquences. N'investissez que des sommes que vous pouvez vous permettre de perdre.",
          "Avant toute décision, il est recommandé de consulter un conseiller financier indépendant agréé.",
        ],
      },
    ],
  },
  cgu: {
    slug: "cgu",
    title: "Conditions générales d'utilisation",
    updated: "Août 2026",
    intro:
      "Les présentes conditions régissent l'utilisation du service VISITRADE. En créant un compte, vous les acceptez sans réserve.",
    sections: [
      {
        h: "1. Objet du service",
        body: [
          "VISITRADE fournit des outils d'analyse de marché assistés par intelligence artificielle : analyses d'actifs, scénarios, statistiques, scanner, assistant conversationnel et suivi de portefeuille, à des fins d'information et d'aide à la décision.",
        ],
      },
      {
        h: "2. Compte utilisateur",
        body: [
          "La création d'un compte requiert des informations exactes. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.",
          "Vous devez être majeur et disposer de la capacité juridique pour souscrire au service.",
        ],
      },
      {
        h: "3. Abonnements et paiement",
        body: [
          "Le service propose une offre gratuite (Free) et des offres payantes (Pro, Elite). Les abonnements payants sont sans engagement et résiliables à tout moment ; l'accès reste actif jusqu'à la fin de la période déjà réglée.",
          "Les paiements sont traités par un prestataire tiers sécurisé (Stripe). VISITRADE ne stocke pas vos données de carte bancaire.",
        ],
      },
      {
        h: "4. Utilisation acceptable",
        body: [
          "Vous vous engagez à ne pas détourner le service, à ne pas tenter d'en compromettre la sécurité, ni à en extraire massivement les données de façon automatisée.",
        ],
      },
      {
        h: "5. Limitation de responsabilité",
        body: [
          "Le service est fourni « en l'état ». VISITRADE ne saurait être tenu responsable des décisions prises par l'utilisateur ni des pertes financières en résultant. Voir l'Avertissement sur les risques.",
        ],
      },
      {
        h: "6. Modification et résiliation",
        body: [
          "VISITRADE peut faire évoluer le service et les présentes conditions. En cas de modification substantielle, les utilisateurs seront informés. Vous pouvez résilier votre compte à tout moment depuis vos réglages.",
        ],
      },
    ],
  },
  confidentialite: {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    updated: "Août 2026",
    intro:
      "Cette politique décrit comment VISITRADE collecte, utilise et protège vos données personnelles, conformément au RGPD.",
    sections: [
      {
        h: "Données collectées",
        body: [
          "Données de compte : nom, adresse email, mot de passe (chiffré).",
          "Données d'usage : watchlist, positions de portefeuille, préférences, journal — nécessaires au fonctionnement du service.",
          "Données techniques : logs, adresse IP, type d'appareil, à des fins de sécurité et d'amélioration.",
        ],
      },
      {
        h: "Utilisation des données",
        body: [
          "Vos données servent à fournir le service, gérer votre abonnement, sécuriser votre compte et améliorer VISITRADE. Nous ne revendons jamais vos données personnelles.",
        ],
      },
      {
        h: "Sous-traitants",
        body: [
          "Nous faisons appel à des prestataires pour l'hébergement, les paiements (Stripe), l'envoi d'emails et l'analyse d'audience. Ils sont tenus à la confidentialité et n'accèdent qu'aux données nécessaires.",
        ],
      },
      {
        h: "Vos droits (RGPD)",
        body: [
          "Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition sur vos données. Vous pouvez les exercer depuis vos réglages ou en nous contactant.",
          "Vous pouvez à tout moment demander la suppression de votre compte et de l'ensemble de vos données.",
        ],
      },
      {
        h: "Cookies",
        body: [
          "VISITRADE utilise des cookies strictement nécessaires (session, sécurité) et, avec votre consentement, des cookies de mesure d'audience. Vous pouvez gérer vos préférences via le bandeau de consentement.",
        ],
      },
    ],
  },
  mentions: {
    slug: "mentions",
    title: "Mentions légales",
    updated: "Août 2026",
    intro:
      "Informations légales relatives à l'éditeur du service VISITRADE. (À compléter avec les informations réelles de votre société avant le lancement.)",
    sections: [
      {
        h: "Éditeur",
        body: [
          "VISITRADE — [Raison sociale à compléter]",
          "[Forme juridique, capital social, SIREN/SIRET]",
          "[Adresse du siège social]",
          "Contact : [email de contact]",
        ],
      },
      {
        h: "Directeur de la publication",
        body: ["[Nom du responsable de la publication]"],
      },
      {
        h: "Hébergement",
        body: [
          "Le service est hébergé par [Vercel Inc. / hébergeur à préciser], dont le siège est situé à [adresse de l'hébergeur].",
        ],
      },
      {
        h: "Propriété intellectuelle",
        body: [
          "L'ensemble des éléments du service (marque, interface, textes, code) est protégé. Toute reproduction non autorisée est interdite.",
        ],
      },
    ],
  },
};

export const LEGAL_ORDER = ["risques", "cgu", "confidentialite", "mentions"];
