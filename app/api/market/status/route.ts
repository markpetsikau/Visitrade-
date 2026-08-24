import { NextResponse } from "next/server";
import { provider } from "@/lib/market-data/provider";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    live: provider.isLive,
    source: provider.source,
  });
}
