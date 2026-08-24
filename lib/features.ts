export interface Feature {
  icon: string; // lucide icon name
  title: string;
  tagline: string;
  description: string;
  problem: string;
  href: string;
}

export const FEATURES: Feature[] = [
  {
    icon: "Sparkles",
    title: "AI Market Analysis",
    tagline: "Une lecture claire de n'importe quel actif.",
    description:
      "Sélectionnez un actif, l'IA synthétise tendance, volatilité, momentum, niveaux clés et contexte en une analyse structurée.",
    problem: "Trop de données, trop peu de temps pour les lire.",
    href: "/ai",
  },
  {
    icon: "GitBranch",
    title: "Market Scenarios",
    tagline: "Explorez plusieurs futurs, pas une prédiction.",
    description:
      "Trois scénarios (haussier, baissier, neutre) avec conditions, niveaux à surveiller, invalidation et facteurs favorables/défavorables.",
    problem: "Le marché n'a pas un seul avenir — il faut s'y préparer.",
    href: "/scenarios",
  },
  {
    icon: "BarChart3",
    title: "Advanced Statistics",
    tagline: "Les chiffres qui comptent, bien présentés.",
    description:
      "Performance, volatilité, volume, momentum, drawdown, corrélations et historique — dans un tableau de bord lisible.",
    problem: "Les stats brutes sont illisibles et dispersées.",
    href: "/markets",
  },
  {
    icon: "Radar",
    title: "Market Scanner",
    tagline: "Trouvez les configurations qui vous intéressent.",
    description:
      "Filtrez les actifs par tendance, volatilité, momentum, volume, variation et configuration technique.",
    problem: "Passer en revue chaque actif à la main est impossible.",
    href: "/scanner",
  },
  {
    icon: "Star",
    title: "Watchlist",
    tagline: "Vos actifs favoris, toujours à portée.",
    description:
      "Construisez votre liste d'actifs suivis et gardez l'œil sur leurs signaux et analyses en un coup d'œil.",
    problem: "Suivre ses actifs sur dix onglets fait perdre le fil.",
    href: "/watchlist",
  },
  {
    icon: "MessageSquare",
    title: "AI Trading Assistant",
    tagline: "Posez vos questions, comprenez le raisonnement.",
    description:
      "« Pourquoi le BTC baisse ? », « Quels niveaux sur le Nasdaq ? », « Compare BTC et ETH » — des réponses structurées et honnêtes.",
    problem: "Comprendre le « pourquoi » demande de croiser des sources.",
    href: "/ai",
  },
  {
    icon: "Wallet",
    title: "Portfolio & Journal",
    tagline: "Suivez vos décisions et progressez.",
    description:
      "Consignez vos trades, suivez votre performance et vos statistiques personnelles pour apprendre de vos décisions.",
    problem: "Sans journal, on répète les mêmes erreurs.",
    href: "/journal",
  },
  {
    icon: "Bell",
    title: "Alertes intelligentes",
    tagline: "Soyez prévenu quand ça compte.",
    description:
      "Prix atteint, volatilité en hausse, configuration détectée, scénario invalidé ou nouvelle analyse IA disponible.",
    problem: "Impossible de surveiller les marchés 24h/24.",
    href: "/alerts",
  },
];
