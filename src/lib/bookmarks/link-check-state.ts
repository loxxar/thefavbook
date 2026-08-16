/**
 * Types partagés entre la vérification des liens et son interface.
 *
 * Séparés de `link-check-actions.ts` : un fichier `'use server'` ne publie que
 * des fonctions serveur, toute autre valeur exportée arrive `undefined` côté
 * client.
 */

export interface CheckedSample {
  title: string
  status: number
}

export interface CheckBatchResult {
  status: 'running' | 'done' | 'error'
  message: string
  checked: number
  remaining: number
  broken: number
  samples: CheckedSample[]
}

/** Le serveur enchaîne déjà vingt vérifications en parallèle par appel. */
export const DELAY_BETWEEN_CHECK_BATCHES_MS = 400
