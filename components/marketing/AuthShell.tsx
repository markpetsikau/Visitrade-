import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Sparkles, GitBranch, BarChart3 } from "lucide-react";

const highlights = [
  { icon: Sparkles, text: "Analyses IA structurées de chaque actif" },
  { icon: GitBranch, text: "Trois scénarios avec seuils d'invalidation" },
  { icon: BarChart3, text: "Statistiques avancées & scanner de marché" },
  { icon: ShieldCheck, text: "Un outil d'aide à la décision, pas de promesses" },
];

export function AuthShell({
  mode,
  children,
}: {
  mode: "login" | "signup";
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden border-r border-border bg-aurora lg:block">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight text-ink">
              L'intelligence du marché, réunie au même endroit.
            </h2>
            <ul className="mt-8 space-y-4">
              {highlights.map((h) => (
                <li key={h.text} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
                    <h.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-ink-muted">{h.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-ink-faint">
            © 2026 VISITRADE — Le trading comporte un risque de perte en capital.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-base px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
          <p className="mt-8 text-center text-sm text-ink-muted">
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <Link href="/signup" className="font-medium text-brand hover:underline">
                  Créer un compte
                </Link>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <Link href="/login" className="font-medium text-brand hover:underline">
                  Se connecter
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  type = "text",
  placeholder,
  autoComplete,
  name,
  required,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-border-strong bg-surface-raised px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
