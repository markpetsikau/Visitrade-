"use server";

// Auth server actions. Two modes, chosen at runtime:
//   • Supabase configured → real accounts (secure passwords, cross-device).
//   • Otherwise            → demo cookie session (zero-config local loop).
// The calling components (forms) are identical in both modes.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  getSession,
  nameFromEmail,
  type Session,
  type Plan,
} from "./session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function writeDemo(session: Session) {
  cookies().set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

// Turn a raw Supabase error into a short French message for the UI.
function frMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("already registered") || m.includes("already been"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("password") && m.includes("at least"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirme d'abord ton email (lien reçu par mail), puis connecte-toi.";
  return "Une erreur est survenue. Réessaie.";
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const name =
    String(formData.get("name") || "").trim() ||
    (email ? nameFromEmail(email) : "Trader");
  const password = String(formData.get("password") || "");

  if (isSupabaseConfigured()) {
    if (!email || !password) {
      redirect(`/signup?error=${encodeURIComponent("Email et mot de passe requis.")}`);
    }
    const supabase = getServerSupabase()!;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      redirect(`/signup?error=${encodeURIComponent(frMessage(error.message))}`);
    }
    // Welcome email (silently skipped if Resend isn't configured).
    await sendWelcomeEmail(email, name);
    // If email confirmation is required, there's no session yet.
    if (!data.session) {
      redirect(`/login?confirm=1`);
    }
    redirect("/onboarding");
  }

  // Demo fallback.
  const demoEmail = email || "trader@visitrade.app";
  writeDemo({ email: demoEmail, name, plan: "free", onboarded: false });
  await sendWelcomeEmail(demoEmail, name);
  redirect("/onboarding");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (isSupabaseConfigured()) {
    if (!email || !password) {
      redirect(`/login?error=${encodeURIComponent("Email et mot de passe requis.")}`);
    }
    const supabase = getServerSupabase()!;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect(`/login?error=${encodeURIComponent(frMessage(error.message))}`);
    }
    // Route to onboarding on first login, else the dashboard.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let onboarded = false;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .single();
      onboarded = Boolean(data?.onboarded);
    }
    redirect(onboarded ? "/dashboard" : "/onboarding");
  }

  // Demo fallback: any credentials accepted.
  const existing = await getSession();
  const demoEmail = email || "trader@visitrade.app";
  writeDemo({
    email: demoEmail,
    name: existing?.name ?? nameFromEmail(demoEmail),
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
  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (supabase) await supabase.auth.signOut();
    redirect("/login");
  }
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
  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase()!;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    await supabase
      .from("profiles")
      .update({
        onboarded: true,
        trading_style: input.tradingStyle ?? null,
        level: input.level ?? null,
        markets: input.markets ?? null,
      })
      .eq("id", user!.id);
    // Seed the watchlist chosen during onboarding.
    if (input.watchlist?.length) {
      const rows = input.watchlist.map((symbol) => ({
        user_id: user!.id,
        symbol,
      }));
      await supabase.from("watchlist").upsert(rows, {
        onConflict: "user_id,symbol",
      });
    }
    redirect("/dashboard");
  }

  const s = (await getSession()) ?? {
    email: "trader@visitrade.app",
    name: "Trader",
    plan: "free" as Plan,
    onboarded: false,
  };
  writeDemo({
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
  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase()!;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    await supabase.from("profiles").update({ plan }).eq("id", user!.id);
    return;
  }
  const s = await getSession();
  if (!s) redirect("/login");
  writeDemo({ ...s!, plan });
}
