import { isDemoAllowed } from "@/lib/demo-mode";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isStripeConfigured } from "@/lib/billing/stripe";

// ─────────────────────────────────────────────────────────────
// Bandeau d'avertissement « environnement non sécurisé ».
//
// Le mode démo reste pratique en local — mais il accepte n'importe quel
// mot de passe et accorde les plans payants sans paiement. Rien ne le
// signalait à l'écran : on pouvait démontrer le produit à un client, ou
// tourner une vidéo, depuis un environnement ouvert sans s'en rendre
// compte.
//
// Le bandeau n'apparaît que lorsqu'au moins un verrou manque, et jamais
// sur une production correctement configurée.
// ─────────────────────────────────────────────────────────────
export function DemoModeBanner() {
  const gaps: string[] = [];
  if (!isSupabaseConfigured()) gaps.push("comptes non sécurisés (tout mot de passe est accepté)");
  if (!isStripeConfigured()) gaps.push("paiement désactivé");

  // Production correctement câblée : rien à afficher.
  if (!gaps.length) return null;
  // En production, le mode démo est déjà refusé côté serveur : le bandeau
  // n'a de sens que là où il reste réellement permissif.
  if (process.env.NODE_ENV === "production" && !isDemoAllowed()) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[130] flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-b border-warn/30 bg-warn/15 px-4 py-1.5 text-center text-[11px] font-medium text-warn backdrop-blur"
    >
      <span className="font-semibold uppercase tracking-wider">Environnement de développement</span>
      <span className="text-warn/80">— {gaps.join(" · ")}. Ne pas utiliser pour une démonstration client.</span>
    </div>
  );
}
