'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/session'
import { mergeAllDuplicatesAction } from '@/lib/bookmarks/duplicate-actions'
import { BROKEN_WHERE } from '@/lib/bookmarks/link-check'
import { getPrisma } from '@/lib/db'

/**
 * Suppression d'un favori depuis l'inspecteur.
 *
 * Le filtre sur `userId` n'est pas décoratif : une action reste appelable
 * directement, et l'interface ne protège rien.
 */
export async function deleteBookmarkAction(bookmarkId: string): Promise<void> {
  const user = await requireUser()

  await getPrisma().bookmark.deleteMany({
    where: { id: bookmarkId, userId: user.id },
  })

  revalidatePath('/')
}

export interface CleanupResult {
  removedDead: number
  removedDuplicates: number
}

/**
 * Nettoyage groupé : liens morts avérés, puis doublons.
 *
 * POURQUOI seulement ces deux-là : ce sont les seuls verdicts certains. Un
 * 404 vient du serveur lui-même, et deux adresses canoniquement identiques
 * désignent la même page. Les liens sans réponse claire — accès refusé,
 * panne, quota — restent en place ; le doute ne justifie pas une suppression.
 *
 * L'ordre compte. Retirer les morts d'abord évite de garder, parmi des
 * doublons, l'exemplaire qui pointe vers une page disparue.
 */
export async function cleanUpAction(spaceId: string): Promise<CleanupResult> {
  const user = await requireUser()

  const { count: removedDead } = await getPrisma().bookmark.deleteMany({
    where: { userId: user.id, spaceId, ...BROKEN_WHERE },
  })

  const duplicates = await mergeAllDuplicatesAction(spaceId)

  revalidatePath('/')

  return {
    removedDead,
    removedDuplicates: duplicates.ok ? duplicates.removed : 0,
  }
}
