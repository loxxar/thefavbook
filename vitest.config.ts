import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

/**
 * POURQUOI cette configuration : sans l'alias, seuls les modules à imports
 * relatifs étaient testables. Tout fichier passant par `@/` échouait au
 * chargement, ce qui excluait de fait la majeure partie du domaine.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
