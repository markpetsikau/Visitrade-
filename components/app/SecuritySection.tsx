"use client";

// Toute cette section était du décor : le formulaire de mot de passe
// n'avait aucun gestionnaire de soumission, la 2FA annonçait « bientôt
// disponible » et « Supprimer le compte » était un bouton sans action.
// Trois promesses affichées, zéro branchement.
//
// Elle est maintenant réelle : changement de mot de passe avec
// vérification de l'ancien, double authentification par application
// (TOTP), export des données (RGPD art. 20) et suppression définitive
// (RGPD art. 17).

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Trash2,
  Download,
  Loader2,
  KeyRound,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/auth/actions";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";
import { useMe } from "@/components/app/useMe";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";

type Tone = "ok" | "error";
interface Message {
  tone: Tone;
  text: string;
}

function Notice({ message }: { message: Message | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={
        message.tone === "ok"
          ? "mt-3 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand"
          : "mt-3 rounded-lg border border-bear/30 bg-bear/10 px-3 py-2 text-sm text-bear"
      }
    >
      {message.text}
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-medium text-ink-muted">{children}</span>
  );
}

export function SecuritySection() {
  return (
    <div className="space-y-4">
      <PasswordCard />
      <TwoFactorCard />
      <DataCard />
      <SessionCard />
      <DangerCard />
    </div>
  );
}

// ── Mot de passe ──────────────────────────────────────────────
function PasswordCard() {
  const me = useMe();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setMsg(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const current = String(data.get("current") || "");
    const next = String(data.get("next") || "");
    const confirm = String(data.get("confirm") || "");

    const problem = passwordProblem(next);
    if (problem) return setMsg({ tone: "error", text: problem });
    if (next !== confirm) {
      return setMsg({ tone: "error", text: "Les deux mots de passe ne correspondent pas." });
    }
    if (next === current) {
      return setMsg({ tone: "error", text: "Le nouveau mot de passe est identique à l'ancien." });
    }

    const supabase = getBrowserSupabase();
    if (!supabase || !me?.email) {
      return setMsg({ tone: "error", text: "Modification indisponible pour le moment." });
    }

    setBusy(true);
    // On revérifie l'ancien mot de passe avant de le remplacer : sinon
    // un poste laissé déverrouillé suffit à verrouiller le propriétaire
    // hors de son propre compte.
    const { error: reauth } = await supabase.auth.signInWithPassword({
      email: me.email,
      password: current,
    });
    if (reauth) {
      setBusy(false);
      return setMsg({ tone: "error", text: "Mot de passe actuel incorrect." });
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);

    if (error) {
      return setMsg({ tone: "error", text: "Modification impossible. Réessayez." });
    }
    form.reset();
    setMsg({ tone: "ok", text: "Mot de passe mis à jour." });
  };

  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">Mot de passe</h2>
      <p className="mt-0.5 text-sm text-ink-muted">
        Au moins {MIN_PASSWORD_LENGTH} caractères, avec des lettres et au moins un chiffre.
      </p>

      <form onSubmit={submit} className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Mot de passe actuel</Label>
            <input type="password" name="current" className={inputClass} placeholder="••••••••" autoComplete="current-password" required />
          </label>
          <div className="hidden sm:block" />
          <label className="block">
            <Label>Nouveau mot de passe</Label>
            <input type="password" name="next" className={inputClass} placeholder="••••••••" autoComplete="new-password" required />
          </label>
          <label className="block">
            <Label>Confirmer le mot de passe</Label>
            <input type="password" name="confirm" className={inputClass} placeholder="••••••••" autoComplete="new-password" required />
          </label>
        </div>

        <Notice message={msg} />

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Double authentification (TOTP) ────────────────────────────
interface Factor {
  id: string;
  status: string;
  friendly_name?: string;
}

function TwoFactorCard() {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return setFactors([]);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = factors?.find((f) => f.status === "verified");

  const startEnroll = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || busy) return;
    setBusy(true);
    setMsg(null);

    // Une tentative d'inscription abandonnée laisse un facteur non
    // vérifié qui bloquerait la suivante : on nettoie d'abord.
    for (const f of factors ?? []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `VISITRADE ${new Date().toISOString().slice(0, 10)}`,
    });
    setBusy(false);

    if (error || !data) {
      return setMsg({ tone: "error", text: "Impossible de démarrer l'activation. Réessayez." });
    }
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirmEnroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase || !enrolling || busy) return;

    const code = String(new FormData(e.currentTarget).get("code") || "").replace(/\s/g, "");
    setBusy(true);
    setMsg(null);

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: enrolling.id,
    });
    if (cErr || !challenge) {
      setBusy(false);
      return setMsg({ tone: "error", text: "Activation impossible. Réessayez." });
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: enrolling.id,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);

    if (error) {
      return setMsg({ tone: "error", text: "Code incorrect. Vérifiez l'heure de votre téléphone." });
    }
    setEnrolling(null);
    setMsg({ tone: "ok", text: "Double authentification activée." });
    refresh();
  };

  const disable = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !active || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: active.id });
    setBusy(false);
    setMsg(
      error
        ? { tone: "error", text: "Désactivation impossible." }
        : { tone: "ok", text: "Double authentification désactivée." },
    );
    refresh();
  };

  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Double authentification</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Un code à six chiffres depuis votre téléphone, en plus du mot de passe.
          </p>
        </div>
        {active && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            <Check className="h-3.5 w-3.5" /> Activée
          </span>
        )}
      </div>

      {factors === null ? (
        <p className="mt-4 text-sm text-ink-faint">Chargement…</p>
      ) : active ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised/60 p-3.5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p className="text-sm text-ink-muted">
              Un code vous sera demandé à chaque connexion.
            </p>
          </div>
          <Button variant="outline" onClick={disable} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Désactiver
          </Button>
        </div>
      ) : enrolling ? (
        <form onSubmit={confirmEnroll} className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <div
            className="w-fit rounded-xl bg-white p-3 [&_svg]:h-40 [&_svg]:w-40"
            // Le QR est un SVG fourni par Supabase, pas une saisie utilisateur.
            dangerouslySetInnerHTML={{ __html: enrolling.qr }}
          />
          <div>
            <p className="text-sm text-ink-muted">
              Scannez ce code avec Google Authenticator, 1Password, Authy ou
              équivalent, puis saisissez le code affiché.
            </p>
            <p className="mt-2 break-all text-xs text-ink-faint">
              Saisie manuelle : <span className="font-mono text-ink-muted">{enrolling.secret}</span>
            </p>
            <label className="mt-3 block max-w-[200px]">
              <Label>Code à 6 chiffres</Label>
              <input
                name="code"
                className={inputClass}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                required
              />
            </label>
            <div className="mt-4 flex gap-2">
              <Button type="submit" variant="primary" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Activer
              </Button>
              <Button variant="ghost" onClick={() => setEnrolling(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised/60 p-3.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <p className="text-sm text-ink-muted">
              Votre compte est protégé par le mot de passe seul.
            </p>
          </div>
          <Button variant="primary" onClick={startEnroll} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <KeyRound className="h-4 w-4" /> Activer
          </Button>
        </div>
      )}

      <Notice message={msg} />
    </Card>
  );
}

// ── Export des données ────────────────────────────────────────
function DataCard() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setMsg({ tone: "error", text: d?.error ?? "Export indisponible." });
        return;
      }
      // Le téléchargement est déclenché depuis le blob : l'en-tête
      // Content-Disposition ne suffit pas sur une requête fetch.
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visitrade-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({ tone: "ok", text: "Export téléchargé." });
    } catch {
      setMsg({ tone: "error", text: "Export impossible pour le moment." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Exporter mes données</p>
          <p className="text-sm text-ink-muted">
            Profil, watchlist, portefeuille, alertes et journal, dans un fichier JSON.
          </p>
        </div>
        <Button variant="outline" onClick={download} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Télécharger
        </Button>
      </div>
      <Notice message={msg} />
    </Card>
  );
}

// ── Session ───────────────────────────────────────────────────
function SessionCard() {
  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Session</p>
          <p className="text-sm text-ink-muted">Déconnectez-vous de cet appareil.</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            <LogOut className="h-4 w-4" /> Se déconnecter
          </Button>
        </form>
      </div>
    </Card>
  );
}

// ── Suppression définitive ────────────────────────────────────
function DangerCard() {
  const me = useMe();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const confirm = String(new FormData(e.currentTarget).get("confirm") || "");
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ tone: "error", text: data?.error ?? "Suppression impossible." });
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMsg({ tone: "error", text: "Suppression impossible pour le moment." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-bear/40 bg-bear/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-bear">Supprimer le compte</p>
          <p className="text-sm text-ink-muted">
            Définitif. Votre abonnement est résilié et toutes vos données sont effacées.
          </p>
        </div>
        {!open && (
          <Button
            variant="outline"
            className="border-bear/50 text-bear hover:bg-bear/10"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" /> Supprimer le compte
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 border-t border-bear/25 pt-4">
          <p className="text-sm text-ink-muted">
            Pour confirmer, saisissez votre adresse email :{" "}
            <span className="font-medium text-ink">{me?.email}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="min-w-[240px] flex-1">
              <Label>Adresse email</Label>
              <input
                name="confirm"
                type="email"
                className={inputClass}
                placeholder={me?.email ?? "vous@exemple.com"}
                autoComplete="off"
                required
              />
            </label>
            <Button
              type="submit"
              variant="outline"
              className="border-bear/50 text-bear hover:bg-bear/10"
              disabled={busy}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Suppression…" : "Supprimer définitivement"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
          <Notice message={msg} />
        </form>
      )}
    </Card>
  );
}
