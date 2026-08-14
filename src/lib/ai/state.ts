/**
 * Type partagé entre l'action de classement et son interface.
 *
 * Dans un module distinct de `actions.ts` : un fichier `'use server'` ne
 * publie que des fonctions serveur, toute autre valeur exportée arrive
 * `undefined` côté client.
 */
export interface ClassifyBatchResult {
  status: 'running' | 'done' | 'error'
  message: string
  classified: number
  remaining: number
}
