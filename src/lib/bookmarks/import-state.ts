/**
 * État et constantes de l'action d'import.
 *
 * POURQUOI un module séparé de `actions.ts` : un fichier marqué `'use server'`
 * ne publie que des fonctions serveur. Toute autre valeur exportée y est
 * remplacée par une référence, et arrive `undefined` côté client — l'état
 * initial de `useActionState` en particulier.
 */

/** Marge de sécurité sous la limite du corps HTTP réglée dans next.config.ts. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export interface ImportedFileSummary {
  fileName: string
  bookmarks: number
  folders: number
}

export interface ImportActionState {
  status: 'idle' | 'success' | 'error'
  message: string
  /** Détail par fichier, pour que l'utilisateur voie ce qui est entré. */
  imported: ImportedFileSummary[]
}

export const INITIAL_IMPORT_STATE: ImportActionState = {
  status: 'idle',
  message: '',
  imported: [],
}
