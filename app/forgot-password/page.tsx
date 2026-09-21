"use client";

// Cet écran affichait « Vérifiez vos emails » sans jamais rien envoyer :
// un client qui perdait son mot de passe perdait son compte payant.
// Il déclenche désormais le vrai email de réinitialisation Supabase.

import { useState } from "react";
import Link from "next/link";
import { MailCheck, Loader2 } from "lucide-react";
import { AuthShell, AuthField } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!email) return;

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("La réinitialisation n'est pas disponible pour le moment.");
      return;
    }

    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);

    // On confirme même en cas d'erreur « utilisateur inconnu » : révéler
    // qu'une adresse est inscrite permettrait d'énumérer les comptes.
    if (err && !/user|not found|invalid/i.test(err.message)) {
      setError("Envoi impossible pour le moment. Réessayez dans un instant.");
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell mode="login">
      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand/12 text-brand">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Vérifiez vos emails</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Si un compte existe avec cette adresse, vous recevrez un lien pour
            réinitialiser votre mot de passe. Pensez à regarder vos spams.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Mot de passe oublié</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Entrez votre email, nous vous enverrons un lien de réinitialisation.
          </p>
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <AuthField label="Email" type="email" name="email" placeholder="vous@exemple.com" autoComplete="email" required />
            {error && (
              <p className="rounded-lg border border-bear/30 bg-bear/10 px-3 py-2 text-sm text-bear">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Envoi…" : "Envoyer le lien"}
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
