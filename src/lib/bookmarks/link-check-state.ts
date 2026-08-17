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
  /** Mort avéré, ou seulement invérifiable : la nuance décide du sort. */
  kind: 'broken' | 'inconclusive'
}

export interface CheckBatchResult {
  status: 'running' | 'done' | 'error'
  message: string
  checked: number
  remaining: number
  broken: number
  /** Liens sur lesquels rien n'a pu être conclu : bloqués, muets, en panne. */
  inconclusive: number
  samples: CheckedSample[]
}

/** Le serveur enchaîne déjà vingt vérifications en parallèle par appel. */
export const DELAY_BETWEEN_CHECK_BATCHES_MS = 400
