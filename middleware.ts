import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isMfaPending } from "@/lib/auth/mfa";

const SESSION_COOKIE = "visitrade_session";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// App routes that require a session. Marketing pages stay public.
const PROTECTED = [
  "/dashboard",
  "/markets",
  "/scanner",
  "/watchlist",
  "/ai",
  "/predictions",
  "/scenarios",
  "/portfolio",
  "/journal",
  "/alerts",
  "/settings",
  "/onboarding",
];

function needsAuth(pathname: string): boolean {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/*
 * Mot de passe validé, code à usage unique pas encore fourni.
 * La session existe donc, mais elle ne doit ouvrir aucune page : on
 * renvoie vers l'écran de vérification, pas vers la connexion — sinon
 * l'utilisateur retaperait son mot de passe en boucle sans jamais
 * comprendre pourquoi ça recommence.
 */
function toMfa(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/mfa";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Supabase mode: refresh the session cookie + gate protected routes.
  if (SUPABASE_URL && SUPABASE_KEY) {
    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (needsAuth(pathname)) {
      if (!user) return toLogin(req);
      if (await isMfaPending(supabase)) return toMfa(req);
    }
    return res;
  }

  // ── Demo mode: simple cookie presence check.
  if (!needsAuth(pathname)) return NextResponse.next();
  if (req.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
  return toLogin(req);
}

// ⚠️ Next.js exige un matcher littéral (analysé à la compilation) : toute
// route ajoutée à PROTECTED doit l'être ici aussi, sinon elle reste ouverte.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/markets/:path*",
    "/scanner/:path*",
    "/watchlist/:path*",
    "/ai/:path*",
    "/predictions/:path*",
    "/scenarios/:path*",
    "/portfolio/:path*",
    "/journal/:path*",
    "/alerts/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
