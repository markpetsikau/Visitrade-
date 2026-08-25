import { NextResponse } from "next/server";
import { getSession, initials } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Non-sensitive session fields for client-side personalization
// (the session cookie itself is httpOnly).
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    name: s.name,
    email: s.email,
    initials: initials(s.name),
    plan: s.plan,
    onboarded: s.onboarded,
  });
}
