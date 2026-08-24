"use server";

// Server actions for the demo auth loop. Swap the cookie writes for a
// real provider (Supabase sign-in/up, session tokens) to go to production —
// the calling components stay identical.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  getSession,
  nameFromEmail,
  type Session,
  type Plan,
} from "./session";
import { sendWelcomeEmail } from "@/lib/email";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function write(session: Session) {
  cookies().set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim() || "trader@visitrade.app";
  const name = String(formData.get("name") || "").trim() || nameFromEmail(email);
  write({ email, name, plan: "free", onboarded: false });
  // Email de bienvenue (ignoré silencieusement si Resend non configuré).
  await sendWelcomeEmail(email, name);
  redirect("/onboarding");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim() || "trader@visitrade.app";
  const existing = getSession();
  // Demo: any credentials are accepted. Real auth would verify here.
  write({
    email,
    name: existing?.name ?? nameFromEmail(email),
    plan: existing?.plan ?? "free",
    onboarded: existing?.onboarded ?? true,
    tradingStyle: existing?.tradingStyle,
    markets: existing?.markets,
    level: existing?.level,
    watchlist: existing?.watchlist,
  });
  redirect("/dashboard");
}

export async function signOutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

export interface OnboardingInput {
  tradingStyle?: string;
  markets?: string[];
  level?: string;
  watchlist?: string[];
}

export async function completeOnboardingAction(input: OnboardingInput) {
  const s = getSession() ?? {
    email: "trader@visitrade.app",
    name: "Trader",
    plan: "free" as Plan,
    onboarded: false,
  };
  write({
    ...s,
    onboarded: true,
    tradingStyle: input.tradingStyle,
    markets: input.markets,
    level: input.level,
    watchlist: input.watchlist,
  });
  redirect("/dashboard");
}

// Demo plan change (used when Stripe is not configured).
export async function setPlanAction(plan: Plan) {
  const s = getSession();
  if (!s) redirect("/login");
  write({ ...s, plan });
}
