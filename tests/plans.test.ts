import { describe, expect, it } from "vitest";
import {
  hasFeature,
  minPlanFor,
  planAfterGrace,
  PAST_DUE_GRACE_DAYS,
  WATCHLIST_MAX,
} from "@/lib/plans";

const DAY = 86_400_000;

describe("droits d'accès par plan", () => {
  it("verrouille pour le plan gratuit tout ce qui est vendu", () => {
    for (const f of [
      "fullAnalysis", "scenarios", "scanner", "assistant",
      "advancedStats", "alerts", "portfolio", "journal", "export", "predictions",
    ] as const) {
      expect(hasFeature("free", f), `free ne doit pas ouvrir ${f}`).toBe(false);
    }
  });

  it("ouvre à Pro tout sauf ce qui est réservé à Elite", () => {
    expect(hasFeature("pro", "scenarios")).toBe(true);
    expect(hasFeature("pro", "assistant")).toBe(true);
    expect(hasFeature("pro", "journal")).toBe(false);
    expect(hasFeature("pro", "export")).toBe(false);
  });

  it("ouvre tout à Elite", () => {
    expect(hasFeature("elite", "journal")).toBe(true);
    expect(hasFeature("elite", "export")).toBe(true);
  });

  it("traite un plan absent comme gratuit", () => {
    expect(hasFeature(undefined, "fullAnalysis")).toBe(false);
  });

  it("annonce le bon plan minimum par fonctionnalité", () => {
    expect(minPlanFor("scenarios")).toBe("pro");
    expect(minPlanFor("journal")).toBe("elite");
  });

  it("plafonne la watchlist du plan gratuit", () => {
    expect(WATCHLIST_MAX.free).toBe(3);
    expect(WATCHLIST_MAX.pro).toBe(Infinity);
  });
});

describe("délai de grâce sur impayé", () => {
  const now = Date.parse("2026-09-13T12:00:00Z");

  it("laisse l'accès ouvert pendant le délai", () => {
    const since = now - 5 * DAY;
    expect(planAfterGrace("pro", "past_due", since, now)).toBe("pro");
  });

  it("ramène au gratuit une fois le délai dépassé", () => {
    const since = now - (PAST_DUE_GRACE_DAYS + 1) * DAY;
    expect(planAfterGrace("pro", "past_due", since, now)).toBe("free");
    expect(planAfterGrace("elite", "past_due", since, now)).toBe("free");
  });

  it("ne touche pas à un abonnement en règle, même très ancien", () => {
    const since = now - 400 * DAY;
    expect(planAfterGrace("pro", "active", since, now)).toBe("pro");
    expect(planAfterGrace("pro", "trialing", undefined, now)).toBe("pro");
  });

  it("accorde le bénéfice du doute si la date d'entrée manque", () => {
    // Profil antérieur à la migration : pas de past_due_since enregistré.
    expect(planAfterGrace("pro", "past_due", undefined, now)).toBe("pro");
  });

  it("ne promeut jamais un compte gratuit", () => {
    expect(planAfterGrace("free", "past_due", now - 999 * DAY, now)).toBe("free");
  });

  it("coupe exactement au-delà de la borne, pas avant", () => {
    const juste = now - PAST_DUE_GRACE_DAYS * DAY;
    expect(planAfterGrace("pro", "past_due", juste, now)).toBe("pro");
    expect(planAfterGrace("pro", "past_due", juste - 1000, now)).toBe("free");
  });
});
