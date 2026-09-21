import "server-only";
import * as Sentry from "@sentry/nextjs";

// ─────────────────────────────────────────────────────────────
// Point de passage unique pour signaler une panne côté serveur.
//
// Avant, les échecs les plus coûteux étaient avalés par des `catch {}`
// silencieux : un webhook Stripe qui n'écrit pas le plan, une clé IA
// refusée, CoinGecko qui renvoie 429. Le symptôme arrivait par un client
// mécontent, jamais par une alerte.
//
// `captureError` écrit toujours dans les logs (utile même sans Sentry)
// et transmet à Sentry quand le DSN est configuré.
// ─────────────────────────────────────────────────────────────

export type Area =
  | "billing.webhook"
  | "billing.checkout"
  | "billing.portal"
  | "account.delete"
  | "ai.analysis"
  | "ai.assistant"
  | "market.coingecko"
  | "market.yahoo"
  | "email";

interface Context {
  /** Repères non nominatifs : symbole, plan, statut… jamais d'email brut. */
  [key: string]: string | number | boolean | undefined;
}

export function captureError(area: Area, error: unknown, context: Context = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[VISITRADE:${area}] ${message}`, context);

  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureException(error instanceof Error ? error : new Error(message), {
    tags: { area },
    extra: context,
  });
}

/**
 * Panne sans exception : une réponse d'API valide mais inutilisable,
 * un webhook reçu pour un compte introuvable. Ça mérite une alerte,
 * pas une exception fabriquée pour la forme.
 */
export function captureIssue(area: Area, message: string, context: Context = {}) {
  console.warn(`[VISITRADE:${area}] ${message}`, context);

  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureMessage(message, {
    level: "warning",
    tags: { area },
    extra: context,
  });
}
