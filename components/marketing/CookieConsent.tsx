"use client";

// Bandeau de consentement.
//
// Il affirmait utiliser « des cookies de mesure d'audience » alors
// qu'aucun traceur n'existait dans le projet, et une fois le choix fait
// il n'y avait plus aucun moyen d'en changer — deux points sur lesquels
// la CNIL est explicite. Désormais : le bandeau n'apparaît que s'il y a
// vraiment quelque chose à consentir, et le choix reste révocable depuis
// le pied de page.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import {
  analyticsConfigured,
  applyConsent,
  readConsent,
  writeConsent,
  CONSENT_VERSION,
  OPEN_PREFERENCES_EVENT,
  type Consent,
} from "@/lib/analytics";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<Consent | null>(null);
  /** Ouvert à la demande depuis le pied de page, même si le choix est fait. */
  const [manual, setManual] = useState(false);

  const tracked = analyticsConfigured();

  useEffect(() => {
    const stored = readConsent();
    setCurrent(stored?.value ?? null);

    // Le traceur est (ré)appliqué à chaque chargement selon le choix gardé.
    applyConsent(stored?.value ?? "essential");

    // Rien à tracer → aucun bandeau : seuls des cookies strictement
    // nécessaires sont posés, et ceux-là n'exigent pas de consentement.
    if (!tracked) return;
    if (!stored || stored.version < CONSENT_VERSION) setShow(true);
  }, [tracked]);

  const open = useCallback(() => {
    setManual(true);
    setShow(true);
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, [open]);

  if (!show) return null;

  const decide = (value: Consent) => {
    writeConsent(value);
    setCurrent(value);
    setShow(false);
    setManual(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Préférences de cookies"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-4"
    >
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border-strong bg-surface/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-brand sm:block" />

        <div className="flex-1 text-sm leading-relaxed text-ink-muted">
          {tracked ? (
            <>
              VISITRADE pose les cookies nécessaires à votre connexion, et — avec
              votre accord — une mesure d'audience anonyme pour savoir quelles
              pages servent vraiment.{" "}
              <Link href="/legal/confidentialite" className="text-brand hover:underline">
                En savoir plus
              </Link>
              .
              {current && (
                <span className="mt-1 block text-xs text-ink-faint">
                  Choix actuel :{" "}
                  {current === "all" ? "mesure d'audience acceptée" : "mesure d'audience refusée"}.
                </span>
              )}
            </>
          ) : (
            <>
              VISITRADE n'utilise que les cookies strictement nécessaires à son
              fonctionnement : votre session et votre choix d'affichage. Aucun
              traceur publicitaire, aucune mesure d'audience.{" "}
              <Link href="/legal/confidentialite" className="text-brand hover:underline">
                En savoir plus
              </Link>
              .
            </>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {tracked ? (
            <>
              <button
                onClick={() => decide("essential")}
                className="rounded-lg border border-border-strong px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
              >
                Refuser
              </button>
              <button
                onClick={() => decide("all")}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#04110F] transition-colors hover:bg-brand-bright"
              >
                Accepter
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShow(false);
                setManual(false);
              }}
              aria-label="Fermer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <X className="h-4 w-4" /> Fermer
            </button>
          )}
        </div>
      </div>
      {/* `manual` distingue l'ouverture spontanée de la réouverture
          volontaire : utile si l'on veut plus tard une animation différente. */}
      <span className="sr-only">{manual ? "Préférences rouvertes" : ""}</span>
    </div>
  );
}
