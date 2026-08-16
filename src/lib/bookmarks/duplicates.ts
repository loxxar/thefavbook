import type { PrismaClient } from '@/generated/prisma/client'

/**
 * Détection des doublons.
 *
 * POURQUOI aucun stockage : le regroupement se calcule d'une requête sur
 * quelques milliers de lignes. Une table de doublons serait périmée au premier
 * import suivant, et il faudrait la reconstruire — autant la recalculer.
 *
 * Le regroupement s'appuie sur `canonicalUrl`, calculée à l'import : elle
 * fusionne http et https, le www, le slash final et les paramètres de suivi,
 * mais conserve ce qui distingue deux pages réelles.
 */

export interface DuplicateEntry {
  id: string
  title: string
  url: string
  folderPath: string
  addDate: Date | null
}

export interface DuplicateGroup {
  canonicalUrl: string
  entries: DuplicateEntry[]
}

/** Au-delà, la liste devient illisible et la page trop lourde. */
export const DUPLICATE_PAGE_SIZE = 40

export async function findDuplicateGroups(
  prisma: PrismaClient,
  userId: string,
  spaceId: string,
): Promise<{ groups: DuplicateGroup[]; totalGroups: number }> {
  const grouped = await prisma.bookmark.groupBy({
    by: ['canonicalUrl'],
    where: { userId, spaceId },
    having: { canonicalUrl: { _count: { gt: 1 } } },
    _count: { canonicalUrl: true },
    orderBy: { _count: { canonicalUrl: 'desc' } },
  })

  const page = grouped.slice(0, DUPLICATE_PAGE_SIZE)

  if (page.length === 0) return { groups: [], totalGroups: 0 }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      spaceId,
      canonicalUrl: { in: page.map((g) => g.canonicalUrl) },
    },
    // Le plus ancien d'abord : c'est celui qu'on proposera de garder.
    orderBy: [{ addDate: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      title: true,
      url: true,
      canonicalUrl: true,
      addDate: true,
      folder: { select: { name: true } },
    },
  })

  const byUrl = new Map<string, DuplicateEntry[]>()

  for (const b of bookmarks) {
    const entries = byUrl.get(b.canonicalUrl) ?? []

    entries.push({
      id: b.id,
      title: b.title,
      url: b.url,
      folderPath: b.folder?.name ?? 'Racine',
      addDate: b.addDate,
    })
    byUrl.set(b.canonicalUrl, entries)
  }

  return {
    groups: page.map((g) => ({
      canonicalUrl: g.canonicalUrl,
      entries: byUrl.get(g.canonicalUrl) ?? [],
    })),
    totalGroups: grouped.length,
  }
}
