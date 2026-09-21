import { describe, expect, it } from "vitest";
import {
  normalCdf,
  probabilityOf,
  expectedMovePct,
  roundLevel,
  isStablecoin,
  hoursLeft,
} from "@/lib/predictions/engine";
import type { Asset } from "@/lib/types";

describe("loi normale", () => {
  it("vaut 50 % en zéro et tend vers les bornes", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(5)).toBeGreaterThan(0.999);
    expect(normalCdf(-5)).toBeLessThan(0.001);
  });

  it("est symétrique", () => {
    for (const x of [0.3, 1, 1.96, 2.5]) {
      expect(normalCdf(x) + normalCdf(-x)).toBeCloseTo(1, 5);
    }
  });

  it("retrouve les quantiles connus", () => {
    expect(normalCdf(1.6449)).toBeCloseTo(0.95, 3);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
  });
});

describe("probabilité de franchissement", () => {
  const PRICE = 80_000;
  const VOL = 50; // % annualisé
  const H = 24 * 7;

  it("reste dans les bornes affichables", () => {
    for (const strike of [1, 40_000, 79_999, 80_001, 200_000, 5_000_000]) {
      const p = probabilityOf(PRICE, strike, VOL, H, "above");
      expect(p).toBeGreaterThanOrEqual(0.5);
      expect(p).toBeLessThanOrEqual(99.5);
    }
  });

  it("« au-dessus » et « en dessous » du même seuil sont complémentaires", () => {
    const a = probabilityOf(PRICE, 85_000, VOL, H, "above");
    const b = probabilityOf(PRICE, 85_000, VOL, H, "below");
    expect(a + b).toBeCloseTo(100, 6);
  });

  it("décroît strictement tant que la borne d'affichage n'est pas atteinte", () => {
    const seuils = [81_000, 84_000, 88_000, 92_000];
    const probas = seuils.map((s) => probabilityOf(PRICE, s, VOL, H, "above"));
    for (let i = 1; i < probas.length; i++) {
      expect(probas[i]).toBeLessThan(probas[i - 1]);
    }
  });

  it("ne remonte jamais quand le seuil s'éloigne, borne comprise", () => {
    // Au-delà d'une certaine distance la valeur est plafonnée à 0,5 % :
    // la suite devient constante, elle ne doit jamais repartir à la hausse.
    const seuils = [81_000, 90_000, 100_000, 130_000, 400_000];
    const probas = seuils.map((s) => probabilityOf(PRICE, s, VOL, H, "above"));
    for (let i = 1; i < probas.length; i++) {
      expect(probas[i]).toBeLessThanOrEqual(probas[i - 1]);
    }
    expect(probas[probas.length - 1]).toBe(0.5);
  });

  it("est proche de 50 % au seuil courant, sur un horizon court", () => {
    const p = probabilityOf(PRICE, PRICE, VOL, 24, "above");
    expect(p).toBeGreaterThan(45);
    expect(p).toBeLessThan(50); // sans dérive, le terme -σ²T/2 pousse juste sous 50
  });

  it("ne parie sur aucune direction : plus de temps rapproche de 50 %", () => {
    const proche = probabilityOf(PRICE, 100_000, VOL, 24, "above");
    const lointain = probabilityOf(PRICE, 100_000, VOL, 24 * 90, "above");
    expect(lointain).toBeGreaterThan(proche);
  });

  it("renvoie une valeur neutre sur des entrées absurdes plutôt que NaN", () => {
    expect(probabilityOf(0, 100, VOL, H, "above")).toBe(50);
    expect(probabilityOf(PRICE, 0, VOL, H, "above")).toBe(50);
    expect(probabilityOf(PRICE, 100, VOL, 0, "above")).toBe(50);
  });

  it("une volatilité plus forte élargit la fourchette", () => {
    const calme = probabilityOf(PRICE, 100_000, 20, H, "above");
    const agite = probabilityOf(PRICE, 100_000, 120, H, "above");
    expect(agite).toBeGreaterThan(calme);
  });
});

describe("amplitude attendue", () => {
  it("croît avec l'horizon, en racine du temps", () => {
    const j1 = expectedMovePct(60, 24);
    const j4 = expectedMovePct(60, 96);
    expect(j4 / j1).toBeCloseTo(2, 1); // 4× le temps → 2× l'amplitude
  });

  it("reste positive et finie", () => {
    expect(expectedMovePct(0, 24)).toBeGreaterThan(0);
    expect(Number.isFinite(expectedMovePct(10_000, 24))).toBe(true);
  });
});

describe("paliers de seuils", () => {
  it("place le seuil au-dessus strictement au-dessus du cours", () => {
    for (const price of [0.41, 1.41, 99.9, 2_483, 76_767]) {
      expect(roundLevel(price, "above")).toBeGreaterThan(price);
    }
  });

  it("place le seuil en dessous strictement sous le cours", () => {
    for (const price of [0.41, 1.41, 99.9, 2_483, 76_767]) {
      expect(roundLevel(price, "below")).toBeLessThan(price);
    }
  });

  it("s'éloigne à mesure que l'index augmente", () => {
    const p = 76_767;
    expect(roundLevel(p, "above", 1)).toBeGreaterThan(roundLevel(p, "above", 0));
    expect(roundLevel(p, "below", 1)).toBeLessThan(roundLevel(p, "below", 0));
  });
});

describe("sélection des actifs du board", () => {
  const base = (over: Partial<Asset>): Asset =>
    ({
      symbol: "BTC", name: "Bitcoin", class: "crypto", price: 1,
      changePct24h: 0, changePct7d: 0, volume24h: 0, volatility: 40,
      momentum: 0, trendStrength: 0, rsi: 50, spark: [1, 1], series: [1, 1],
      high52: 1, low52: 1, drawdown: 0, ...over,
    }) as Asset;

  it("écarte les stablecoins, qui ne posent aucune question intéressante", () => {
    expect(isStablecoin(base({ symbol: "USDT", name: "Tether", price: 1 }))).toBe(true);
    expect(isStablecoin(base({ symbol: "BTC", name: "Bitcoin", price: 76_000 }))).toBe(false);
  });
});

describe("temps restant", () => {
  const now = Date.parse("2026-09-13T12:00:00Z");
  it("compte les heures jusqu'à l'échéance", () => {
    expect(hoursLeft(now + 3_600_000 * 5, now)).toBeCloseTo(5, 3);
  });
  it("ne descend pas sous zéro une fois l'échéance passée", () => {
    expect(hoursLeft(now - 3_600_000, now)).toBeGreaterThanOrEqual(0);
  });
});
