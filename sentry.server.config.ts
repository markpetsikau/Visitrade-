// Remontée d'erreurs — serveur (Node).
// Entièrement pilotée par SENTRY_DSN : sans la variable, Sentry ne
// s'initialise pas et n'ajoute aucune latence.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // 10 % des requêtes tracées : assez pour voir les lenteurs, pas assez
    // pour exploser le quota du plan gratuit.
    tracesSampleRate: 0.1,
    // Aucune capture d'écran ni contenu de formulaire : l'app manipule
    // des données financières, on ne les envoie pas à un tiers.
    sendDefaultPii: false,
  });
}
