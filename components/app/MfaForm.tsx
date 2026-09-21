"use client";

// Écran de second facteur. On y arrive quand le mot de passe est validé
// mais que le compte exige en plus un code à usage unique.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2 } from "lucide-react";
import { AuthShell, AuthField } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";

export function MfaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [factorId, setFactorId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.mfa
      .listFactors()
      .then(({ data }) => {
        const verified = data?.totp?.find((f) => f.status === "verified");
        setFactorId(verified?.id ?? null);
        // Plus aucun facteur à vérifier : rien ne retient ici.
        if (!verified) router.replace(next);
      })
      .catch(() => setError("Vérification indisponible."))
      .finally(() => setReady(true));
  }, [router, next]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase || !factorId || busy) return;

    const code = String(new FormData(e.currentTarget).get("code") || "").replace(/\s/g, "");
    setBusy(true);
    setError(null);

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setBusy(false);
      setError("Vérification impossible. Réessayez.");
      return;
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);

    if (vErr) {
      setError("Code incorrect ou expiré. Un nouveau code est généré toutes les 30 secondes.");
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <AuthShell mode="login">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/12 text-brand">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Vérification en deux étapes</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Saisissez le code à six chiffres affiché par votre application
        d'authentification.
      </p>

      <form className="mt-8 space-y-4" onSubmit={submit}>
        <AuthField
          label="Code à 6 chiffres"
          type="text"
          name="code"
          placeholder="000000"
          autoComplete="one-time-code"
          required
        />
        {error && (
          <p className="rounded-lg border border-bear/30 bg-bear/10 px-3 py-2 text-sm text-bear">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !ready}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Vérification…" : "Vérifier"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-muted">
        <form action={signOutAction}>
          <button type="submit" className="font-medium text-brand hover:underline">
            Se connecter avec un autre compte
          </button>
        </form>
        <p className="mt-3 text-xs text-ink-faint">
          Téléphone perdu ?{" "}
          <Link href="/legal/mentions" className="text-brand hover:underline">
            Contactez-nous
          </Link>{" "}
          pour retrouver l'accès.
        </p>
      </div>
    </AuthShell>
  );
}
