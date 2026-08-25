// ─────────────────────────────────────────────────────────────
// Supabase browser client — used inside client components.
// Returns null when Supabase isn't configured (local demo mode).
// ─────────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

export { isSupabaseConfigured } from "./config";

export function getBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
