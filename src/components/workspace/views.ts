import type { BookmarkRow } from '@/lib/bookmarks/rows'

/**
 * Vues de la source list.
 *
 * POURQUOI un type fermé plutôt qu'une chaîne libre : chaque vue a son
 * prédicat, et l'exhaustivité du `switch` garantit qu'aucune n'est ajoutée
 * sans être filtrée.
 */
export type View =
  | { kind: 'all' }
  | { kind: 'recent' }
  | { kind: 'dead' }
  | { kind: 'unknown' }
  | { kind: 'duplicates' }
  | { kind: 'suggestions' }
  | { kind: 'unfiled' }
  | { kind: 'folder'; id: string }

/** Les trente derniers jours : au-delà, « récent » ne veut plus rien dire. */
const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Adresse ramenée à ce qui distingue deux pages réelles.
 *
 * Reproduit côté client la normalisation retenue en base pour le
 * dédoublonnage : protocole, `www`, slash final et paramètres de suivi
 * n'établissent pas une page différente.
 */
const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_[ce]id$|igshid$|ref$)/i

export function canonical(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    const path = parsed.pathname.replace(/\/+$/, '')

    const kept = [...parsed.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAMS.test(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    return `${host}${path}${kept === '' ? '' : `?${kept}`}`
  } catch {
    return url
  }
}

/** Adresses présentes plus d'une fois, pour la vue des doublons. */
export function duplicateKeys(rows: readonly BookmarkRow[]): Set<string> {
  const seen = new Map<string, number>()

  for (const row of rows) {
    const key = canonical(row.url)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }

  const repeated = new Set<string>()
  for (const [key, count] of seen) {
    if (count > 1) repeated.add(key)
  }

  return repeated
}

export function matchesView(
  row: BookmarkRow,
  view: View,
  duplicates: Set<string>,
  now: number,
): boolean {
  switch (view.kind) {
    case 'all':
      return true
    case 'recent':
      return row.addedAt !== null && now - row.addedAt < RECENT_WINDOW_MS
    case 'dead':
      return row.health === 'dead'
    case 'unknown':
      return row.health === 'unknown'
    case 'duplicates':
      return duplicates.has(canonical(row.url))
    case 'suggestions':
      return row.suggestion !== null
    case 'unfiled':
      return row.folderId === null
    case 'folder':
      return row.folderId === view.id
  }
}

/** Recherche sur le titre et l'adresse, insensible à la casse. */
export function matchesQuery(row: BookmarkRow, query: string): boolean {
  if (query === '') return true

  const needle = query.toLowerCase()

  return (
    row.title.toLowerCase().includes(needle) ||
    row.url.toLowerCase().includes(needle)
  )
}
