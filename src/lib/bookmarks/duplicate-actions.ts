'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

/**
 * Fusion des doublons.
 *
 * L'utilisateur désigne le favori qu'il garde ; les autres du même groupe sont
 * supprimés. Rien n'est décidé d'office : une normalisation d'URL trop zélée
 * effacerait des pages réellement distinctes, sans retour possible.
 */

export interface MergeResult {
  ok: boolean
  message: string
  removed: number
}

export async function mergeDuplicatesAction(
  canonicalUrl: string,
  keepId: string,
  spaceId: string,
): Promise<MergeResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const keeper = await prisma.bookmark.findFirst({
    where: { id: keepId, userId: user.id, spaceId, canonicalUrl },
    select: { id: true },
  })

  // Sans cette vérification, un identifiant forgé ferait supprimer tout le
  // groupe sans rien conserver.
  if (keeper === null) {
    return { ok: false, message: 'Favori à conserver introuvable.', removed: 0 }
  }

  const { count } = await prisma.bookmark.deleteMany({
    where: {
      userId: user.id,
      spaceId,
      canonicalUrl,
      id: { not: keeper.id },
    },
  })

  revalidatePath('/')

  return { ok: true, message: '', removed: count }
}

/**
 * Fusionne tous les groupes d'un coup, en gardant le plus ancien de chacun.
 *
 * Le plus ancien porte la date d'ajout d'origine : c'est celui qui garde la
 * mémoire de quand le lien a été mis de côté.
 */
export async function mergeAllDuplicatesAction(
  spaceId: string,
): Promise<MergeResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const groups = await prisma.bookmark.groupBy({
    by: ['canonicalUrl'],
    where: { userId: user.id, spaceId },
    having: { canonicalUrl: { _count: { gt: 1 } } },
  })

  if (groups.length === 0) {
    return { ok: true, message: 'Aucun doublon.', removed: 0 }
  }

  let removed = 0

  for (const group of groups) {
    const entries = await prisma.bookmark.findMany({
      where: { userId: user.id, spaceId, canonicalUrl: group.canonicalUrl },
      orderBy: [{ addDate: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    })

    const [keeper, ...rest] = entries

    if (keeper === undefined || rest.length === 0) continue

    const { count } = await prisma.bookmark.deleteMany({
      where: { id: { in: rest.map((r) => r.id) }, userId: user.id },
    })

    removed += count
  }

  revalidatePath('/')

  return { ok: true, message: '', removed }
}
