// Remontée d'erreurs — navigateur.
// Le DSN doit être public pour être lisible côté client : c'est prévu
// par Sentry, un DSN ne permet que d'ENVOYER des événements.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // Bruit connu et sans intérêt : extensions de navigateur, coupures
    // réseau pendant un sondage de prix, onglet fermé en plein vol.
    ignoreErrors: [
      "ResizeObserver loop",
      "Failed to fetch",
      "NetworkError",
      "AbortError",
      "Load failed",
    ],
  });
}
