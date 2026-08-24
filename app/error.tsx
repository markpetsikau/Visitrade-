"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-aurora px-5">
      <div className="text-center">
        <Logo className="mx-auto" />
        <div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-warn/10 text-warn">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-ink">Une erreur est survenue</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          Quelque chose s'est mal passé de notre côté. Réessayez, ou revenez au
          tableau de bord.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset} size="md">Réessayer</Button>
          <Button href="/dashboard" variant="outline" size="md">Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
