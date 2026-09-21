// Chemin d'import recommandé : `@sentry/nextjs` tout court est déprécié
// pour cette fonction et cessera de marcher en v11.
import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */

// En-têtes de sécurité appliqués à toutes les réponses.
// Un SaaS payant sans X-Frame-Options peut être encadré dans un iframe
// tiers et détourné au clic (clickjacking sur le bouton d'abonnement).
const securityHeaders = [
  // Clickjacking : aucun site tiers ne peut encadrer VISITRADE.
  { key: "X-Frame-Options", value: "DENY" },
  // Le navigateur ne devine plus le type MIME (XSS par fichier déguisé).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // On ne fuite pas l'URL complète (qui peut porter un symbole, un plan…).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Aucune API sensible n'est utilisée : on les coupe toutes.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HTTPS obligatoire pendant 2 ans (ignoré en local, en http).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Next 14 : nécessaire pour que `instrumentation.ts` soit chargé.
  experimental: { instrumentationHook: true },
  // `X-Powered-By: Next.js` annonce la pile et sa version : inutile.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Sentry n'est branché que si un DSN est présent : sans lui,
// `withSentryConfig` n'ajoute rien au bundle et le build reste identique.
// L'envoi des sources (source maps) demande en plus un jeton d'auteur ;
// sans jeton, l'étape est simplement sautée.
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      // Les traces d'erreur restent lisibles sans exposer le code source
      // aux visiteurs : les sources sont envoyées à Sentry puis effacées.
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      // Retire les journaux de débogage de Sentry du bundle de production.
      webpack: { treeshake: { removeDebugLogging: true } },
    })
  : nextConfig;
