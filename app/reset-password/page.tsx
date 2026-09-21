"use client";

// Écran d'arrivée du lien de réinitialisation. Supabase a déjà ouvert une
// session temporaire via /auth/callback : il reste à écrire le nouveau
// mot de passe.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";
import { AuthShell, AuthField } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sans session de récupération valide, le lien est expiré ou déjà utilisé.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setReady(false);
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data }) => setReady(Boolean(data.user)))
      .catch(() => setReady(false));
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");

    const weak = passwordProblem(password);
    if (weak) {
      setError(weak);
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (err) {
      setError("Mise à jour impossible. Le lien a peut-être expiré.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <AuthShell mode="login">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/12 text-brand">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
        Nouveau mot de passe
      </h1>

      {ready === false ? (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            Ce lien n'est plus valable. Les liens de réinitialisation expirent
            après un court délai, et ne servent qu'une fois.
          </p>
          <Button href="/forgot-password" size="lg" className="mt-6 w-full">
            Demander un nouveau lien
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-ink-muted">
            Au moins {MIN_PASSWORD_LENGTH} caractères, avec des lettres et au moins un chiffre.
          </p>
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <AuthField
              label="Nouveau mot de passe"
              type="password"
              name="password"
              autoComplete="new-password"
              required
            />
            <AuthField
              label="Confirmer le mot de passe"
              type="password"
              name="confirm"
              autoComplete="new-password"
              required
            />
            {error && (
              <p className="rounded-lg border border-bear/30 bg-bear/10 px-3 py-2 text-sm text-bear">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy || ready === null}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-muted">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
