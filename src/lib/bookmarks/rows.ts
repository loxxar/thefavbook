import {
  BROKEN_WHERE,
  isBroken,
  isInconclusive,
} from '@/lib/bookmarks/link-check'
import type { PrismaClient } from '@/generated/prisma/client'

/**
 * Lecture à plat pour la vue en liste.
 *
 * POURQUOI ne pas réutiliser `readBookmarkTree` : l'arbre sert à l'export, il
 * porte les favicons et les descriptions, et il impose une hiérarchie dont la
 * liste n'a que faire. Ici on veut des lignes, triables et filtrables sur
 * quatre colonnes, et rien de plus lourd.
 */

/** État d'un lien réduit à ce que l'affichage doit distinguer. */
export type RowHealth = 'ok' | 'dead' | 'unknown' | 'idle'

export interface BookmarkRow {
  id: string
  title: string
  url: string
  host: string
  folderPath: string
  folderId: string | null
  health: RowHealth
  /** Code HTTP brut, pour l'inspecteur. `null` si jamais vérifié. */
  status: number | null
  /** Millisecondes — une `Date` ne franchit pas la frontière serveur/client. */
  addedAt: number | null
  /** Suggestion de rangement en attente, le cas échéant. */
  suggestion: { id: string; folderPath: string; reason: string | null } | null
}

export interface FolderNode {
  id: string
  name: string
  path: string
  depth: number
  count: number
}

export interface WorkspaceData {
  rows: BookmarkRow[]
  folders: FolderNode[]
  counts: {
    total: number
    dead: number
    unknown: number
    unchecked: number
    duplicates: number
    suggestions: number
  }
}

/** Sans protocole ni www : c'est le domaine que l'œil cherche dans la colonne. */
function toHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.split('/')[0] ?? url
  }
}

function toHealth(status: number | null): RowHealth {
  if (status === null) return 'idle'
  if (isBroken(status)) return 'dead'
  if (isInconclusive(status)) return 'unknown'
  return 'ok'
}

/**
 * Charge tout l'espace en une passe.
 *
 * POURQUOI tout charger plutôt que paginer côté serveur : le filtrage par
 * catégorie et la recherche doivent répondre à la frappe. Un aller-retour par
 * caractère rendrait la liste poussive, et quelques milliers de lignes
 * réduites à sept champs restent d'un poids raisonnable.
 */
export async function readWorkspace(
  prisma: PrismaClient,
  userId: string,
  spaceId: string,
): Promise<WorkspaceData> {
  const [bookmarks, folderRecords, duplicateGroups, suggestionCount] =
    await Promise.all([
      prisma.bookmark.findMany({
        where: { userId, spaceId },
        select: {
          id: true,
          title: true,
          url: true,
          folderId: true,
          checkStatus: true,
          addDate: true,
          createdAt: true,
          suggestion: {
            where: { status: 'PENDING' },
            select: { id: true, folderPath: true, reason: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.folder.findMany({
        where: { userId, spaceId },
        select: { id: true, name: true, parentId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.bookmark.groupBy({
        by: ['canonicalUrl'],
        where: { userId, spaceId },
        _count: { canonicalUrl: true },
        having: { canonicalUrl: { _count: { gt: 1 } } },
      }),
      prisma.suggestion.count({
        where: { userId, status: 'PENDING', bookmark: { spaceId } },
      }),
    ])

  // Les chemins se reconstruisent en mémoire : les remonter en SQL demanderait
  // une récursive pour un gain nul sur quelques centaines de dossiers.
  const byId = new Map(folderRecords.map((f) => [f.id, f]))

  function pathOf(id: string | null): string {
    const parts: string[] = []
    let current = id

    while (current !== null) {
      const folder = byId.get(current)
      if (folder === undefined) break
      parts.unshift(folder.name)
      current = folder.parentId
    }

    return parts.join(' / ')
  }

  const rows: BookmarkRow[] = bookmarks.map((b) => {
    const pending = b.suggestion

    return {
      id: b.id,
      title: b.title === '' ? b.url : b.title,
      url: b.url,
      host: toHost(b.url),
      folderPath: pathOf(b.folderId),
      folderId: b.folderId,
      health: toHealth(b.checkStatus),
      status: b.checkStatus,
      addedAt: (b.addDate ?? b.createdAt).getTime(),
      suggestion:
        pending === null
          ? null
          : {
              id: pending.id,
              folderPath: pending.folderPath,
              reason: pending.reason,
            },
    }
  })

  const perFolder = new Map<string, number>()
  for (const row of rows) {
    if (row.folderId === null) continue
    perFolder.set(row.folderId, (perFolder.get(row.folderId) ?? 0) + 1)
  }

  const folders: FolderNode[] = folderRecords
    .map((f) => {
      const path = pathOf(f.id)

      return {
        id: f.id,
        name: f.name,
        path,
        depth: path.split(' / ').length - 1,
        count: perFolder.get(f.id) ?? 0,
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))

  const dead = await prisma.bookmark.count({
    where: { userId, spaceId, ...BROKEN_WHERE },
  })

  return {
    rows,
    folders,
    counts: {
      total: rows.length,
      dead,
      unknown: rows.filter((r) => r.health === 'unknown').length,
      unchecked: rows.filter((r) => r.health === 'idle').length,
      duplicates: duplicateGroups.length,
      suggestions: suggestionCount,
    },
  }
}
