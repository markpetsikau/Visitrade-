// ─────────────────────────────────────────────────────────────
// Mesure d'audience — chargée UNIQUEMENT après consentement.
//
// Le bandeau cookies demandait l'accord pour une « mesure d'audience »
// qui n'existait nulle part dans le projet : consentement réclamé pour
// rien, et donc bandeau impossible à justifier devant la CNIL.
//
// Ce module règle les deux bouts du problème :
//   • sans variables d'environnement, il n'y a aucun traceur — et le
//     bandeau de consentement ne s'affiche pas du tout, puisque seuls
//     des cookies strictement nécessaires sont posés (ceux-là ne
//     requièrent pas de consentement) ;
//   • avec elles, le script n'est injecté qu'après un « Accepter »,
//     et il est retiré si l'utilisateur revient sur son choix.
//
// Compatible avec les mesureurs sans cookie à script unique
// (Plausible, Umami, Fathom…), volontairement : ils demandent moins de
// données personnelles qu'un Google Analytics.
// ─────────────────────────────────────────────────────────────

export const CONSENT_KEY = "visitrade_cookie_consent";
/** Bump this when the wording or the trackers change: the choice is re-asked. */
export const CONSENT_VERSION = 2;

export type Consent = "all" | "essential";

export interface StoredConsent {
  value: Consent;
  version: number;
  at: string;
}

const SCRIPT_ID = "visitrade-analytics";

export function analyticsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_ANALYTICS_SRC && process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN,
  );
}

export function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    // L'ancien format stockait juste "all" / "essential" en clair.
    if (raw === "all" || raw === "essential") {
      return { value: raw, version: 1, at: "" };
    }
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed?.value === "all" || parsed?.value === "essential") return parsed;
  } catch {
    /* illisible → on redemandera */
  }
  return null;
}

export function writeConsent(value: Consent): StoredConsent {
  const stored: StoredConsent = {
    value,
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
  } catch {
    /* navigation privée : le choix vaut pour la session */
  }
  applyConsent(value);
  return stored;
}

/** Injecte ou retire le traceur selon le choix courant. */
export function applyConsent(value: Consent) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(SCRIPT_ID);

  if (value !== "all" || !analyticsConfigured()) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = process.env.NEXT_PUBLIC_ANALYTICS_SRC!;
  script.setAttribute("data-domain", process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN!);
  document.head.appendChild(script);
}

// Le pied de page demande la réouverture du panneau par cet événement :
// le choix doit rester modifiable à tout moment, la CNIL l'exige.
export const OPEN_PREFERENCES_EVENT = "visitrade:cookie-preferences";

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
}
