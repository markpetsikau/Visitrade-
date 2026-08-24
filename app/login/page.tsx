import { AuthShell, AuthField } from "@/components/marketing/AuthShell";
import { Button } from "@/components/ui/Button";
import { signInAction } from "@/lib/auth/actions";

export const metadata = { title: "Connexion — VISITRADE" };

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Bon retour</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Connectez-vous pour retrouver vos analyses.
      </p>

      <form action={signInAction} className="mt-8 space-y-4">
        <AuthField label="Email" type="email" name="email" placeholder="vous@exemple.com" autoComplete="email" />
        <AuthField label="Mot de passe" type="password" name="password" placeholder="••••••••" autoComplete="current-password" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="checkbox" className="h-4 w-4 rounded border-border-strong bg-surface-raised accent-brand" />
            Se souvenir de moi
          </label>
          <a href="/forgot-password" className="text-brand hover:underline">Mot de passe oublié ?</a>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Se connecter
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-faint">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={signInAction} className="mt-6">
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          Continuer avec Google
        </Button>
      </form>
    </AuthShell>
  );
}
