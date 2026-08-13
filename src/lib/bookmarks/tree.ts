import type { PrismaClient } from '@/generated/prisma/client'
import type { ParsedFolder, ParsedNode } from '@/lib/bookmarks/types'

/**
 * Relecture de l'arbre depuis la base, dans le même modèle que le parseur.
 *
 * POURQUOI ce modèle et pas un type dédié à l'affichage : l'export attend
 * exactement cette forme. Une structure intermédiaire obligerait à maintenir
 * deux conversions au lieu d'une, et c'est là que les pertes s'installent.
 *
 * Deux requêtes, pas une par niveau : l'arbre est reconstruit en mémoire.
 */
export async function readBookmarkTree(
  prisma: PrismaClient,
  userId: string,
): Promise<ParsedNode[]> {
  const [folders, bookmarks] = await Promise.all([
    prisma.folder.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        parentId: true,
        name: true,
        isToolbar: true,
        addDate: true,
        lastModified: true,
      },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { title: 'asc' }],
      select: {
        folderId: true,
        title: true,
        url: true,
        description: true,
        faviconUrl: true,
        addDate: true,
        lastModified: true,
      },
    }),
  ])

  const childrenOf = new Map<string | null, ParsedNode[]>()

  function bucket(parentId: string | null): ParsedNode[] {
    const found = childrenOf.get(parentId)
    if (found !== undefined) return found

    const created: ParsedNode[] = []
    childrenOf.set(parentId, created)
    return created
  }

  const folderNodes = new Map<string, ParsedFolder>()

  for (const folder of folders) {
    folderNodes.set(folder.id, {
      kind: 'folder',
      title: folder.name,
      addDate: folder.addDate,
      lastModified: folder.lastModified,
      isToolbar: folder.isToolbar,
      children: bucket(folder.id),
    })
  }

  // Rattachement dans un second temps : un dossier peut précéder son parent
  // dans le tri par position.
  for (const folder of folders) {
    const node = folderNodes.get(folder.id)
    if (node !== undefined) bucket(folder.parentId).push(node)
  }

  for (const bookmark of bookmarks) {
    bucket(bookmark.folderId).push({
      kind: 'bookmark',
      title: bookmark.title,
      url: bookmark.url,
      addDate: bookmark.addDate,
      lastModified: bookmark.lastModified,
      description: bookmark.description,
      iconDataUri: null,
      iconUrl: bookmark.faviconUrl,
      tags: [],
    })
  }

  return bucket(null)
}
