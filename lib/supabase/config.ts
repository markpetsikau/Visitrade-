// ─────────────────────────────────────────────────────────────
// Supabase config — safe to import from both server and client.
// Only reads NEXT_PUBLIC_* env vars (no next/headers, no browser API),
// so it never breaks a server component or a client bundle.
//
// The value of NEXT_PUBLIC_SUPABASE_ANON_KEY can be either a legacy
// `anon` JWT (eyJ...) or the new publishable key (sb_publishable_...).
// Both work with @supabase/ssr.
// ─────────────────────────────────────────────────────────────

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}
