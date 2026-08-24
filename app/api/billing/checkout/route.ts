import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE, type Plan } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_ENV: Record<Exclude<Plan, "free">, string> = {
  pro: "STRIPE_PRICE_PRO",
  elite: "STRIPE_PRICE_ELITE",
};

function persistPlan(plan: Plan) {
  const s = getSession();
  if (!s) return;
  cookies().set(SESSION_COOKIE, JSON.stringify({ ...s, plan }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: Plan };
  if (!["free", "pro", "elite"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  // Downgrade / free is always a direct change.
  if (plan === "free") {
    persistPlan("free");
    return NextResponse.json({ demo: true, plan: "free" });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[PRICE_ENV[plan]];
  const origin = new URL(req.url).origin;

  // Real Stripe Checkout when configured.
  if (secret && priceId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret);
      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: session.email,
        success_url: `${origin}/settings?upgraded=${plan}`,
        cancel_url: `${origin}/pricing`,
        metadata: { plan, email: session.email },
      });
      // NOTE: in production, confirm the plan via a Stripe webhook
      // (checkout.session.completed) before granting access.
      return NextResponse.json({ url: checkout.url });
    } catch {
      return NextResponse.json({ error: "Stripe indisponible." }, { status: 502 });
    }
  }

  // Demo mode (no keys): grant the plan immediately so the loop works.
  persistPlan(plan);
  return NextResponse.json({ demo: true, plan });
}
