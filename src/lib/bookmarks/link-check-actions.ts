'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/session'
import {
  BROKEN_WHERE,
  CHECK_BATCH_SIZE,
  checkLink,
  isBroken,
  isInconclusive,
  STATUS_UNVERIFIABLE,
} from '@/lib/bookmarks/link-check'
import type { CheckBatchResult } from '@/lib/bookmarks/link-check-state'
import { getPrisma } from '@/lib/db'

/**
 * Vérifie un lot de liens et s'arrête.
 *
 * POURQUOI par lots : quelques milliers de requêtes sortantes dépasseraient les
 * 300 secondes d'une fonction Vercel. Le client rappelle jusqu'à épuisement, ce
 * qui donne aussi une progression réelle.
 */
export async function checkNextLinksAction(
  spaceId: string,
): Promise<CheckBatchResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const pending = await prisma.bookmark.findMany({
    where: { userId: user.id, spaceId, checkedAt: null },
    select: { id: true, title: true, url: true },
    take: CHECK_BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  })

  if (pending.length === 0) {
    return {
      status: 'done',
      message: 'Tous les liens ont été vérifiés.',
      checked: 0,
      remaining: 0,
      broken: 0,
      inconclusive: 0,
      samples: [],
    }
  }

  // Les vérifications d'un lot partent ensemble : elles attendent le réseau,
  // pas le processeur.
  const results = await Promise.all(
    pending.map(async (b) => ({ bookmark: b, result: await checkLink(b.url) })),
  )

  const now = new Date()

  await prisma.$transaction(
    results.map(({ bookmark, result }) =>
      prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          checkedAt: now,
          checkStatus: result.status,
          redirectsTo: result.redirectsTo,
        },
      }),
    ),
  )

  const [remaining, broken, inconclusive] = await Promise.all([
    prisma.bookmark.count({
      where: { userId: user.id, spaceId, checkedAt: null },
    }),
    prisma.bookmark.count({
      where: { userId: user.id, spaceId, ...BROKEN_WHERE },
    }),
    prisma.bookmark.count({
      where: {
        userId: user.id,
        spaceId,
        NOT: BROKEN_WHERE,
        OR: [
          { checkStatus: 0 },
          { checkStatus: STATUS_UNVERIFIABLE },
          { checkStatus: { gte: 400 } },
        ],
      },
    }),
  ])

  revalidatePath('/')

  return {
    status: remaining === 0 ? 'done' : 'running',
    message: '',
    checked: results.length,
    remaining,
    broken,
    inconclusive,
    // Les invérifiables figurent au journal sans jamais rejoindre le décompte
    // des morts : l'utilisateur voit ce qui a résisté, sans qu'on le lui
    // propose à la suppression.
    samples: results
      .filter(
        ({ result }) =>
          isBroken(result.status) || isInconclusive(result.status),
      )
      .map(({ bookmark, result }) => ({
        title: bookmark.title === '' ? bookmark.url : bookmark.title,
        status: result.status,
        kind: isBroken(result.status)
          ? ('broken' as const)
          : ('inconclusive' as const),
      })),
  }
}

/** Oublie les résultats, pour relancer une campagne complète. */
export async function resetLinkChecksAction(spaceId: string): Promise<number> {
  const user = await requireUser()

  const { count } = await getPrisma().bookmark.updateMany({
    where: { userId: user.id, spaceId },
    data: { checkedAt: null, checkStatus: null, redirectsTo: null },
  })

  revalidatePath('/')

  return count
}

/**
 * Supprime les favoris dont le lien est mort, après validation explicite.
 *
 * Ne partent que les 404 et 410, seuls codes par lesquels un serveur déclare
 * qu'une page n'existe plus. Un accès refusé, un quota atteint, une panne ou
 * une adresse hors de portée sont épargnés : ils ne disent rien de la validité
 * du favori.
 */
export async function deleteBrokenLinksAction(
  spaceId: string,
): Promise<number> {
  const user = await requireUser()

  const { count } = await getPrisma().bookmark.deleteMany({
    where: { userId: user.id, spaceId, ...BROKEN_WHERE },
  })

  revalidatePath('/')

  return count
}
