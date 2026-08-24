export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "VISITRADE prédit-il les marchés ?",
    a: "Non, et c'est volontaire. VISITRADE est un outil d'analyse et d'aide à la décision. Il structure les données, dégage des scénarios possibles (haussier, baissier, neutre) et met en avant les niveaux à surveiller. Aucune analyse n'est présentée comme une certitude, et rien ne garantit un résultat.",
  },
  {
    q: "Comment fonctionne l'analyse par IA ?",
    a: "Le moteur reçoit des données de marché structurées (tendance, momentum, volatilité, niveaux, statistiques) et non un simple prompt vague. Il produit une synthèse organisée qui sépare clairement les données observées, l'interprétation, les scénarios, les hypothèses et les risques.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui. Les abonnements sont sans engagement : vous pouvez passer d'un plan à l'autre ou résilier quand vous le souhaitez depuis vos réglages. L'accès reste actif jusqu'à la fin de la période déjà payée.",
  },
  {
    q: "Est-ce un conseil en investissement ?",
    a: "Non. VISITRADE ne fournit aucun conseil en investissement ni recommandation personnalisée. Les contenus sont fournis à titre informatif. Le trading comporte un risque de perte en capital ; vous restez seul responsable de vos décisions.",
  },
  {
    q: "D'où viennent les données ?",
    a: "L'application repose sur une couche de données abstraite (marketDataProvider) conçue pour se connecter à des fournisseurs de données de marché reconnus. Dans cette version prototype, les données sont simulées et clairement signalées comme telles dans l'interface.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "La confidentialité est un principe de conception : vos watchlists, votre journal et vos réglages vous appartiennent. Nous ne revendons pas vos données et l'authentification est sécurisée.",
  },
  {
    q: "Quelle est la différence entre Free, Pro et Elite ?",
    a: "Le plan Free permet de découvrir l'outil avec un nombre limité d'analyses IA par jour. Pro débloque les analyses étendues, les scénarios complets, le scanner complet, les alertes et l'assistant IA. Elite ajoute des limites quasi-illimitées, les alertes temps réel, le journal avec analytics et l'export.",
  },
  {
    q: "Sur quels marchés VISITRADE fonctionne-t-il ?",
    a: "Cette version se concentre sur la crypto, les indices et les matières premières. L'architecture est pensée pour ajouter facilement d'autres classes d'actifs (actions, forex) sans refonte.",
  },
];
