import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";

describe("politique de mot de passe", () => {
  it("accepte un mot de passe conforme", () => {
    expect(passwordProblem("cheval-bleu-42")).toBeNull();
  });

  it("refuse en dessous du minimum", () => {
    expect(passwordProblem("abc123")).toContain(String(MIN_PASSWORD_LENGTH));
    // Un caractère de moins que le minimum, mais par ailleurs conforme.
    expect(passwordProblem("b".repeat(MIN_PASSWORD_LENGTH - 2) + "1")).not.toBeNull();
  });

  it("accepte pile le minimum", () => {
    expect(passwordProblem("b".repeat(MIN_PASSWORD_LENGTH - 1) + "1")).toBeNull();
  });

  it("exige au moins un chiffre et une lettre", () => {
    expect(passwordProblem("motdepasseunique")).toContain("chiffre");
    expect(passwordProblem("1234567890123")).toContain("lettre");
  });

  it("refuse les mots de passe les plus courants", () => {
    expect(passwordProblem("motdepasse1")).toContain("courant");
    expect(passwordProblem("VISITRADE123")).toContain("courant");
  });

  it("refuse une lettre répétée", () => {
    expect(passwordProblem("aaaaaaaaaaaa")).not.toBeNull();
  });

  it("refuse au-delà de la limite bcrypt plutôt que de tronquer en silence", () => {
    expect(passwordProblem("a1" + "x".repeat(80))).toContain("72");
  });

  it("accepte une phrase de passe longue", () => {
    expect(passwordProblem("le marche monte parfois 2026")).toBeNull();
  });
});
