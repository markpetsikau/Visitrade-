// ─────────────────────────────────────────────────────────────
// Session layer (demo).
//
// A lightweight cookie-based session so the product loop actually works:
// signup → onboarding → dashboard → upgrade, with the app personalized
// and gated. It is architected to swap in a real auth provider
// (Supabase / Auth.js) without touching the UI — replace the read/write
// helpers here and the server actions in ./actions.ts.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import type { Plan } from "@/lib/plans";

export type { Plan };

export interface Session {
  email: string;
  name: string;
  plan: Plan;
  onboarded: boolean;
  tradingStyle?: string;
  markets?: string[];
  level?: string;
  watchlist?: string[];
}

export const SESSION_COOKIE = "visitrade_session";

export function getSession(): Session | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "trader";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
