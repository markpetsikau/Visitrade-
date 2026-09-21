import { describe, expect, it } from "vitest";
import { changeSincePreviousClose } from "@/lib/market-data/yahoo";
import {
  computeRSI,
  computeVolatility,
  computeTrendStrength,
  downsample,
  sma,
} from "@/lib/market-data/indicators";

describe("variation depuis la clôture précédente", () => {
  // Le bug d'origine : `chartPreviousClose` est la clôture qui précède la
  // FENÊTRE demandée (3 mois), pas celle de la veille. Le S&P 500
  // ressortait à +3,55 % un jour où il avait fait +0,86 %.
  it("ignore chartPreviousClose quand la série suffit", () => {
    const closes = [7394.3, 7500.0, 7591.7, 7656.98]; // dernière = séance en cours
    const change = changeSincePreviousClose(7656.98, closes, {
      chartPreviousClose: 7394.3,
    });
    expect(change).toBeCloseTo(0.86, 2);
    expect(change).not.toBeCloseTo(3.55, 1);
  });

  it("utilise la dernière clôture quand elle n'est pas la séance en cours", () => {
    // Avant l'ouverture : le prix courant diffère nettement du dernier point.
    const closes = [100, 110];
    expect(changeSincePreviousClose(121, closes)).toBeCloseTo(10, 6);
  });

  it("retombe sur les métadonnées quand la série est vide", () => {
    expect(changeSincePreviousClose(110, [], { previousClose: 100 })).toBeCloseTo(10, 6);
    expect(changeSincePreviousClose(110, [], { chartPreviousClose: 100 })).toBeCloseTo(10, 6);
  });

  it("renvoie 0 plutôt que NaN sur des données inutilisables", () => {
    expect(changeSincePreviousClose(0, [100, 110])).toBe(0);
    expect(changeSincePreviousClose(110, [])).toBe(0);
    expect(changeSincePreviousClose(110, [], { previousClose: 0 })).toBe(0);
  });

  it("donne une variation négative quand le marché baisse", () => {
    expect(changeSincePreviousClose(95, [100, 95])).toBeCloseTo(-5, 6);
  });
});

describe("indicateurs", () => {
  it("RSI proche de 100 sur une hausse ininterrompue", () => {
    const hausse = Array.from({ length: 40 }, (_, i) => 100 + i);
    expect(computeRSI(hausse)).toBeGreaterThan(95);
  });

  it("RSI proche de 0 sur une baisse ininterrompue", () => {
    const baisse = Array.from({ length: 40 }, (_, i) => 200 - i);
    expect(computeRSI(baisse)).toBeLessThan(5);
  });

  it("RSI reste borné entre 0 et 100", () => {
    const bruit = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i) * 8);
    const rsi = computeRSI(bruit);
    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  it("volatilité nulle sur une série plate, positive sinon", () => {
    expect(computeVolatility(Array(30).fill(100))).toBeCloseTo(0, 6);
    const agite = Array.from({ length: 30 }, (_, i) => 100 * (1 + (i % 2 ? 0.05 : -0.05)));
    expect(computeVolatility(agite)).toBeGreaterThan(0);
  });

  it("force de tendance bornée 0-100", () => {
    for (const [chg, rsi] of [[-90, 2], [0, 50], [400, 99]] as const) {
      const t = computeTrendStrength(chg, rsi);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(100);
    }
  });

  it("moyenne mobile simple sur la bonne fenêtre", () => {
    expect(sma([1, 2, 3, 4, 5], 5)).toBeCloseTo(3, 6);
    expect(sma([1, 2], 5)).toBeNull();
  });

  it("le sous-échantillonnage garde les extrémités et la longueur voulue", () => {
    const serie = Array.from({ length: 500 }, (_, i) => i);
    const out = downsample(serie, 32);
    // Contrat « ~n points » : n échantillons réguliers plus la dernière
    // valeur, pour que la sparkline finisse exactement sur le cours réel.
    expect(out.length).toBe(33);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(499);
  });

  it("laisse une série déjà courte intacte", () => {
    const courte = [1, 2, 3];
    expect(downsample(courte, 32)).toEqual(courte);
  });

  it("reste croissant : le sous-échantillonnage ne réordonne rien", () => {
    const serie = Array.from({ length: 500 }, (_, i) => i);
    const out = downsample(serie, 32);
    for (let i = 1; i < out.length; i++) expect(out[i]).toBeGreaterThan(out[i - 1]);
  });
});
