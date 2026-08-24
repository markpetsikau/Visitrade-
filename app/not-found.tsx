import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-aurora px-5">
      <div className="text-center">
        <Logo className="mx-auto" />
        <div className="mt-8 text-7xl font-bold text-gradient-brand">404</div>
        <h1 className="mt-2 text-xl font-semibold text-ink">Page introuvable</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          Cette page ou cet actif n'existe pas. Retournez au tableau de bord pour
          continuer votre analyse.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button href="/dashboard" size="md">Aller au dashboard</Button>
          <Button href="/" variant="outline" size="md">Accueil</Button>
        </div>
      </div>
    </div>
  );
}
