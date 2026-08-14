/**
 * Types et constantes partagés entre l'action de classement et son interface.
 *
 * Dans un module distinct de `actions.ts` : un fichier `'use server'` ne
 * publie que des fonctions serveur, toute autre valeur exportée arrive
 * `undefined` côté client. Et distinct de `gemini.ts`, qui lit la clé d'API et
 * n'a rien à faire dans un paquet livré au navigateur.
 */

export interface ClassifyBatchResult {
  status: 'running' | 'done' | 'quota' | 'error'
  message: string
  classified: number
  remaining: number
}

/**
 * Pause entre deux lots, côté client.
 *
 * Le palier gratuit de Gemini autorise 10 requêtes par minute. Une collection
 * de 4000 favoris demande une quarantaine de lots : sans pause, le onzième
 * serait rejeté. Six secondes et demie laissent une marge.
 */
export const DELAY_BETWEEN_BATCHES_MS = 6_500

/** Attente après un dépassement de quota, avant une seule nouvelle tentative. */
export const QUOTA_COOLDOWN_MS = 60_000
