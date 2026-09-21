import "server-only";

// ─────────────────────────────────────────────────────────────
// Garde-fou « mode démo ».
//
// L'application bascule en mode démo dès que Supabase n'est pas
// configuré. En local c'est pratique ; en production c'est un trou :
//
//   • n'importe quel email + n'importe quel mot de passe ouvre un compte ;
//   • la session est un cookie JSON NON SIGNÉ — `httpOnly` empêche le JS
//     de la page d'y toucher, pas un `curl -b 'visitrade_session={"plan":"elite"}'` ;
//   • /api/billing/checkout accorde le plan payant sans aucun paiement.
//
// Un simple oubli de variable d'environnement chez l'hébergeur suffisait
// donc à distribuer l'Elite gratuitement. En production, le mode démo est
// désormais refusé : mieux vaut un site déconnecté qu'un site ouvert.
// `VISITRADE_ALLOW_DEMO=1` permet de le réactiver sciemment (recette).
// ─────────────────────────────────────────────────────────────

export function isDemoAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.VISITRADE_ALLOW_DEMO === "1";
}

let warned = false;

/** À appeler avant tout repli démo. Renvoie false si le repli est interdit. */
export function allowDemoFallback(): boolean {
  if (isDemoAllowed()) return true;
  if (!warned) {
    warned = true;
    console.error(
      "[VISITRADE] Supabase n'est pas configuré en production : les sessions " +
        "démo sont refusées. Renseignez NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (ou VISITRADE_ALLOW_DEMO=1 en recette).",
    );
  }
  return false;
}
