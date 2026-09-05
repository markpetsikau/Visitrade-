export const SITE = {
  name: "VISITRADE",
  tagline: "L'intelligence du marché, réunie au même endroit.",
};

export const MARKETING_NAV = [
  { label: "Fonctionnalités", href: "/features" },
  { label: "Comment ça marche", href: "/how-it-works" },
  { label: "Tarifs", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export interface Plan {
  id: "free" | "pro" | "elite";
  name: string;
  priceMonthly: number;
  priceYearly: number; // per month, billed yearly
  tagline: string;
  highlighted?: boolean;
  cta: string;
  features: string[];
  limits: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Pour découvrir VISITRADE avec l'essentiel.",
    cta: "Commencer gratuitement",
    limits: "1 analyse complète / mois",
    features: [
      "Prix crypto en temps réel",
      "Aperçu d'analyse (contexte & tendance)",
      "1 analyse IA complète par mois",
      "Watchlist jusqu'à 3 actifs",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    priceYearly: 19,
    tagline: "Pour les traders actifs qui veulent tout au même endroit.",
    highlighted: true,
    cta: "Passer au Pro",
    limits: "Analyses IA illimitées",
    features: [
      "Analyses IA complètes & illimitées",
      "Scénarios de marché (bull / bear / neutre)",
      "Scanner de marché complet",
      "Statistiques avancées & corrélations",
      "Assistant IA complet",
      "Portfolio & watchlists illimitées",
      "Alertes personnalisées",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    priceMonthly: 79,
    priceYearly: 49,
    tagline: "Pour les traders les plus exigeants et outils pro.",
    cta: "Passer à l'Elite",
    limits: "Analyses quasi-illimitées",
    features: [
      "Tout le plan Pro, sans compromis",
      "Analyses IA quasi-illimitées + priorité",
      "Alertes temps réel multi-conditions",
      "Journal de trading + analytics de performance",
      "Corrélations & scénarios approfondis",
      "Export de données (CSV / API)",
      "Support prioritaire",
    ],
  },
];

export const APP_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Markets", href: "/markets", icon: "CandlestickChart" },
  { label: "Scanner", href: "/scanner", icon: "Radar" },
  { label: "Watchlist", href: "/watchlist", icon: "Star" },
  { label: "AI Analysis", href: "/ai", icon: "Sparkles" },
  { label: "Prédictions", href: "/predictions", icon: "Percent" },
  { label: "Scenarios", href: "/scenarios", icon: "GitBranch" },
  { label: "Portfolio", href: "/portfolio", icon: "Wallet" },
  { label: "Journal", href: "/journal", icon: "NotebookPen" },
  { label: "Alerts", href: "/alerts", icon: "Bell" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const DISCLAIMER_SHORT =
  "VISITRADE est un outil d'analyse et d'aide à la décision. Aucune information ne constitue un conseil en investissement ni une garantie de résultat.";

export const DISCLAIMER_LONG =
  "Les analyses, scénarios et statistiques fournis par VISITRADE sont produits à des fins d'information et d'aide à la décision uniquement. Ils ne constituent en aucun cas un conseil en investissement, une recommandation personnalisée, ni une sollicitation d'achat ou de vente d'un quelconque instrument financier. Le trading comporte un risque de perte en capital. Les performances passées ne préjugent pas des performances futures. Les données affichées dans ce prototype sont simulées et illustratives.";
