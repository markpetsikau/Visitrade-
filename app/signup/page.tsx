import { AuthShell, AuthField } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { signUpAction } from "@/lib/auth/actions";

export const metadata = { title: "Créer un compte — VISITRADE" };

export default function SignupPage() {
  return (
    <AuthShell mode="signup">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Créer un compte</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Gratuit, sans carte bancaire. Prêt en une minute.
      </p>

      <form action={signUpAction} className="mt-8 space-y-4">
        <AuthField label="Nom" name="name" placeholder="Votre nom" autoComplete="name" />
        <AuthField label="Email" type="email" name="email" placeholder="vous@exemple.com" autoComplete="email" />
        <AuthField label="Mot de passe" type="password" name="password" placeholder="8 caractères minimum" autoComplete="new-password" />
        <label className="flex items-start gap-2 text-xs text-ink-muted">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-border-strong bg-surface-raised accent-brand" />
          <span>
            J'accepte les conditions d'utilisation et je comprends que VISITRADE est
            un outil d'aide à la décision, sans garantie de résultat.
          </span>
        </label>
        <Button type="submit" size="lg" className="w-full">
          Créer mon compte gratuit
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-faint">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={signUpAction} className="mt-6">
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          S'inscrire avec Google
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-brand" /> Sans engagement</span>
        <span className="flex items-center gap-1"><Check className="h-3 w-3 text-brand" /> Résiliable à tout moment</span>
      </div>
    </AuthShell>
  );
}
