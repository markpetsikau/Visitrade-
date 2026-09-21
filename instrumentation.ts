// Point d'entrée de l'instrumentation Next.js.
// Charge la configuration Sentry correspondant au runtime courant.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Remonte les erreurs survenues pendant le rendu serveur d'une page.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
