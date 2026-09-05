// ─────────────────────────────────────────────────────────────
// Client Supabase « service role » — réservé aux traitements sans
// utilisateur connecté (webhook Stripe, tâches serveur).
//
// Il contourne la RLS : il ne doit JAMAIS être importé depuis un
// composant client, ni utilisé pour servir une requête d'un visiteur.
// Renvoie null si la clé n'est pas configurée.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

export function getAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
