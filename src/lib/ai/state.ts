/**
 * Types et constantes partagés entre l'action de classement et son interface.
 *
 * Dans un module distinct de `actions.ts` : un fichier `'use server'` ne
 * publie que des fonctions serveur, toute autre valeur exportée arrive
 * `undefined` côté client. Et distinct de `openrouter.ts`, qui lit la clé
 * d'API et n'a rien à faire dans un paquet livré au navigateur.
 */

/** Un rangement décidé, tel qu'affiché dans le journal d'analyse. */
export interface ClassifiedSample {
  title: string
  folderPath: string
}

export interface ClassifyBatchResult {
  status: 'running' | 'done' | 'quota' | 'error'
  message: string
  classified: number
  remaining: number
  /**
   * Les rangements décidés dans ce lot.
   *
   * Renvoyés pour que l'interface montre le travail en train de se faire
   * plutôt qu'un pourcentage muet : sur quatre minutes, voir défiler les
   * décisions est le seul moyen de juger si l'analyse part dans le mur.
   */
  samples: ClassifiedSample[]
}

/**
 * Pause entre deux lots, côté client.
 *
 * Flash-Lite autorise 15 requêtes par minute en gratuit, soit une toutes les
 * quatre secondes. Sans pause, une collection de 4000 favoris — une
 * quarantaine de lots — se ferait rejeter dès le seizième. Quatre secondes et
 * demie laissent une marge.
 */
export const DELAY_BETWEEN_BATCHES_MS = 4_500

/** Attente après un dépassement de quota, avant une seule nouvelle tentative. */
export const QUOTA_COOLDOWN_MS = 60_000

/** Longueur du journal conservé à l'écran. Au-delà, plus personne ne lit. */
export const LOG_LENGTH = 40
