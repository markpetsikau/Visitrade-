import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Les tests visent les fonctions pures du domaine : calcul de
// probabilités, droits d'abonnement, politique de mot de passe,
// indicateurs et lecture des cours. Aucun réseau, aucune base.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
