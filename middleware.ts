import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "visitrade_session";

// App routes that require a session. Marketing pages stay public.
const PROTECTED = [
  "/dashboard",
  "/markets",
  "/scanner",
  "/watchlist",
  "/ai",
  "/scenarios",
  "/portfolio",
  "/journal",
  "/alerts",
  "/settings",
  "/onboarding",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!needsAuth) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/markets/:path*",
    "/scanner/:path*",
    "/watchlist/:path*",
    "/ai/:path*",
    "/scenarios/:path*",
    "/portfolio/:path*",
    "/journal/:path*",
    "/alerts/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
