"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const KEY = "visitrade_cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const decide = (value: "all" | "essential") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border-strong bg-surface/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-brand sm:block" />
        <p className="flex-1 text-sm leading-relaxed text-ink-muted">
          Nous utilisons des cookies nécessaires au fonctionnement du site et, avec
          votre accord, des cookies de mesure d'audience.{" "}
          <Link href="/legal/confidentialite" className="text-brand hover:underline">
            En savoir plus
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
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
        </div>
      </div>
    </div>
  );
}
