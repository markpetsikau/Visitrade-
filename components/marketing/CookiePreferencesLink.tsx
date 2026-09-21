"use client";

// Lien du pied de page qui rouvre le panneau de cookies.
// Le choix doit rester modifiable à tout moment — sans ce point d'entrée,
// un « Refuser » cliqué par réflexe était définitif.

import { openCookiePreferences } from "@/lib/analytics";

export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="text-sm text-ink-muted transition-colors hover:text-ink"
    >
      Gérer les cookies
    </button>
  );
}
