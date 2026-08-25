// ─────────────────────────────────────────────────────────────
// Supabase server client — bound to the request cookies (App Router).
// Use in server components, route handlers and server actions.
// Returns null when Supabase isn't configured (local demo mode).
// ─────────────────────────────────────────────────────────────

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

export function getServerSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — safe to ignore.
          // The session is refreshed by middleware and server actions.
        }
      },
    },
  });
}
