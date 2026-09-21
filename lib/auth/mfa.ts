import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Contrôle du second facteur, côté serveur.
//
// Supabase décrit l'état d'une session par deux niveaux :
//   currentLevel = ce que la session a réellement franchi
//   nextLevel    = ce qu'elle DEVRAIT franchir compte tenu des facteurs
//                  vérifiés sur le compte
//
// Un compte avec une application d'authentification enregistrée a donc
// nextLevel = "aal2". Tant que currentLevel vaut "aal1", le mot de passe
// a été donné mais pas le code : la session existe et ne doit rien ouvrir.
//
// Ce contrôle vit ici pour être appliqué aux deux endroits qui comptent —
// le middleware (redirection) et la couche session (routes d'API) —
// sans risque de divergence entre les deux.
// ─────────────────────────────────────────────────────────────

export async function isMfaPending(
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return false;
    return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
  } catch {
    // En cas de doute on n'enferme pas l'utilisateur dehors : le mot de
    // passe reste exigé de toute façon.
    return false;
  }
}
