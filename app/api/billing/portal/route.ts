import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Portail client Stripe : changement de formule, moyen de paiement,
// factures et résiliation — gérés par Stripe, jamais réimplémentés ici.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const stripe = await getStripe();
  if (!stripe || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Aucun abonnement à gérer en mode démo.", demo: true },
      { status: 409 },
    );
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customer = profile?.stripe_customer_id as string | undefined;
  if (!customer) {
    return NextResponse.json(
      { error: "Aucun abonnement trouvé pour ce compte." },
      { status: 404 },
    );
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${new URL(req.url).origin}/settings`,
    });
    return NextResponse.json({ url: portal.url });
  } catch {
    return NextResponse.json({ error: "Portail indisponible." }, { status: 502 });
  }
}
