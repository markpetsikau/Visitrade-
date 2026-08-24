// ─────────────────────────────────────────────────────────────
// Supabase clients — env-gated.
//
// When NEXT_PUBLIC_SUPABASE_URL + keys are set, VISITRADE uses real
// accounts (secure passwords, cross-device) and server-side persistence.
// When absent, the app falls back to the local demo (cookie session +
// localStorage) — nothing breaks with zero config.
//
// Activation : voir SUPABASE_SETUP.md.
// ─────────────────────────────────────────────────────────────

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}

// Client-side (browser) client — null when not configured.
export function getBrowserSupabase() {
  if (!URL || !ANON) return null;
  return createBrowserClient(URL, ANON);
}

// Server-side client bound to the request cookies (App Router).
export function getServerSupabase() {
  if (!URL || !ANON) return null;
  const store = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component render — safe to ignore;
          // cookies are refreshed by middleware / server actions.
        }
      },
    },
  });
}
