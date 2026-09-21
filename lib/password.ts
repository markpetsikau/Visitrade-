// ─────────────────────────────────────────────────────────────
// Politique de mot de passe — une seule définition, partagée.
//
// Le minimum était celui de Supabase par défaut : six caractères, sans
// aucune autre contrainte. Sur des comptes payants qui portent un
// portefeuille et un journal de trading, c'est trop court : six
// caractères se cassent hors ligne en quelques secondes.
//
// Volontairement simple : longueur + un chiffre. Les règles baroques
// (majuscule, caractère spécial, rotation trimestrielle) produisent des
// mots de passe plus faibles parce que les gens les contournent tous de
// la même façon. Les recommandations actuelles (NIST SP 800-63B, ANSSI)
// privilégient la longueur.
//
// Client-safe : importable depuis le navigateur comme depuis le serveur.
// ─────────────────────────────────────────────────────────────

export const MIN_PASSWORD_LENGTH = 10;

/** Refusés d'office : ils sont en tête de toutes les listes d'attaque. */
const COMMON = new Set([
  "password", "motdepasse", "azertyuiop", "qwertyuiop", "1234567890",
  "motdepasse1", "password1", "password123", "azerty123", "qwerty123",
  "visitrade", "visitrade1", "visitrade123", "administrateur", "0123456789",
]);

/**
 * Renvoie le problème à afficher, ou `null` si le mot de passe convient.
 * Le message est en français et dit quoi corriger, pas juste « invalide ».
 */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  if (password.length > 72) {
    // bcrypt tronque au-delà : autant le dire plutôt que rogner en silence.
    return "Le mot de passe ne peut pas dépasser 72 caractères.";
  }
  if (!/\d/.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre.";
  }
  if (COMMON.has(password.toLowerCase())) {
    return "Ce mot de passe est trop courant. Choisissez-en un autre.";
  }
  if (/^(.)\1+$/.test(password)) {
    return "Le mot de passe ne peut pas être une seule lettre répétée.";
  }
  return null;
}
