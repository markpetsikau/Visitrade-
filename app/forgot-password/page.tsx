"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell, AuthField } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

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
            réinitialiser votre mot de passe.
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
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Real reset e-mail is sent by the auth provider once configured.
              setSent(true);
            }}
          >
            <AuthField label="Email" type="email" name="email" placeholder="vous@exemple.com" autoComplete="email" required />
            <Button type="submit" size="lg" className="w-full">
              Envoyer le lien
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
