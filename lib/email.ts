// ─────────────────────────────────────────────────────────────
// Transactional email (Resend) — env-gated.
// Si RESEND_API_KEY est absent, l'envoi est simplement ignoré
// (l'inscription fonctionne quand même). Pour l'activer : voir
// .env.local.example (RESEND_API_KEY + RESEND_FROM).
// ─────────────────────────────────────────────────────────────

import "server-only";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://visitrade.app";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function welcomeHtml(name: string): string {
  const first = (name || "").split(/\s+/)[0] || "Trader";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#0A0E14;color:#E7ECF3;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
      <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#22E4C6,#0A9E88);"></div>
      <span style="font-size:16px;font-weight:700;letter-spacing:-.2px;">VISI<span style="color:#00D1B2;">TRADE</span></span>
    </div>

    <div style="background:#0F151E;border:1px solid #1E2836;border-radius:18px;padding:28px;">
      <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25;">Bienvenue, ${first} 👋</h1>
      <p style="margin:0 0 16px;color:#95A3B8;font-size:14px;line-height:1.6;">
        Merci d'avoir rejoint VISITRADE. Ton espace est prêt : analyse les marchés en
        temps réel, explore des scénarios et prends des décisions plus claires — grâce
        aux données et à l'IA.
      </p>

      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#00D1B2;color:#04110F;font-weight:700;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:10px;">
        Ouvrir mon tableau de bord →
      </a>

      <div style="margin-top:24px;border-top:1px solid #1E2836;padding-top:18px;">
        <p style="margin:0 0 10px;color:#E7ECF3;font-size:13px;font-weight:600;">Pour bien démarrer :</p>
        <ul style="margin:0;padding-left:18px;color:#95A3B8;font-size:13px;line-height:1.9;">
          <li>Parcours les marchés crypto en direct</li>
          <li>Ouvre une analyse IA sur l'actif de ton choix</li>
          <li>Construis ta watchlist et ton portefeuille</li>
        </ul>
      </div>
    </div>

    <p style="margin:20px 4px 0;color:#5D6B7E;font-size:11px;line-height:1.6;">
      VISITRADE est un outil d'analyse et d'aide à la décision. Aucune information ne
      constitue un conseil en investissement ni une garantie de résultat. Le trading
      comporte un risque de perte en capital.
    </p>
    <p style="margin:8px 4px 0;color:#5D6B7E;font-size:11px;">© 2026 VISITRADE</p>
  </div>
</body></html>`;
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return; // demo mode → skip silently
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "VISITRADE <onboarding@resend.dev>",
      to: email,
      subject: "Bienvenue sur VISITRADE 🎉",
      html: welcomeHtml(name),
    });
  } catch {
    // Ne jamais faire échouer l'inscription à cause de l'email.
  }
}

// ── Confirmation d'abonnement ────────────────────────────────
function planActivatedHtml(plan: string): string {
  const label = plan === "elite" ? "Elite" : "Pro";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#0A0E14;color:#E7ECF3;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
      <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#22E4C6,#0A9E88);"></div>
      <span style="font-size:16px;font-weight:700;letter-spacing:-.2px;">VISI<span style="color:#00D1B2;">TRADE</span></span>
    </div>
    <div style="background:#0F151E;border:1px solid #1E2836;border-radius:18px;padding:28px;">
      <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25;">Votre plan ${label} est actif</h1>
      <p style="margin:0 0 16px;color:#95A3B8;font-size:14px;line-height:1.6;">
        Merci pour votre confiance. Analyses complètes, scénarios, scanner,
        assistant IA et alertes sont désormais ouverts sur votre compte.
      </p>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#00D1B2;color:#04110F;font-weight:700;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:10px;">
        Ouvrir mon tableau de bord →
      </a>
      <p style="margin:20px 0 0;color:#5D6B7E;font-size:12px;line-height:1.6;">
        Vous pouvez résilier à tout moment depuis Réglages → Abonnement.
        La facture correspondante est disponible dans votre espace de facturation Stripe.
      </p>
    </div>
    <p style="margin:20px 4px 0;color:#5D6B7E;font-size:11px;line-height:1.6;">
      VISITRADE est un outil d'analyse et d'aide à la décision. Aucune information ne
      constitue un conseil en investissement ni une garantie de résultat.
    </p>
  </div>
</body></html>`;
}

export async function sendPlanActivatedEmail(email: string, plan: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "VISITRADE <onboarding@resend.dev>",
      to: email,
      subject: `Votre plan ${plan === "elite" ? "Elite" : "Pro"} est actif`,
      html: planActivatedHtml(plan),
    });
  } catch {
    // Un email raté ne doit jamais faire échouer le webhook.
  }
}
