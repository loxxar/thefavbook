'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

/**
 * Déplacement manuel d'un favori.
 *
 * Le classement automatique n'a jamais raison partout : il faut pouvoir
 * corriger à la main ce qu'il a mal rangé, sans repasser par une analyse
 * complète.
 */

const moveSchema = z.object({
  bookmarkId: z.string().min(1),
  /** Null : le favori remonte à la racine. */
  folderId: z.string().min(1).nullable(),
})

export interface MoveResult {
  ok: boolean
  message: string
  /** Dossier d'origine, pour pouvoir défaire le déplacement. */
  previousFolderId: string | null
}

export async function moveBookmarkAction(
  bookmarkId: string,
  folderId: string | null,
): Promise<MoveResult> {
  const user = await requireUser()
  const parsed = moveSchema.safeParse({ bookmarkId, folderId })

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Déplacement invalide.',
      previousFolderId: null,
    }
  }

  const prisma = getPrisma()

  // Le filtre sur userId n'est pas une précaution de confort : c'est la seule
  // barrière entre deux comptes, aucune RLS ne veille derrière.
  const bookmark = await prisma.bookmark.findFirst({
    where: { id: parsed.data.bookmarkId, userId: user.id },
    select: { folderId: true },
  })

  if (bookmark === null) {
    return { ok: false, message: 'Favori introuvable.', previousFolderId: null }
  }

  if (parsed.data.folderId !== null) {
    const folder = await prisma.folder.findFirst({
      where: { id: parsed.data.folderId, userId: user.id },
      select: { id: true },
    })

    if (folder === null) {
      return {
        ok: false,
        message: 'Dossier introuvable.',
        previousFolderId: null,
      }
    }
  }

  if (bookmark.folderId === parsed.data.folderId) {
    return {
      ok: false,
      message: 'Le favori est déjà dans ce dossier.',
      previousFolderId: bookmark.folderId,
    }
  }

  // Le favori arrive en fin de dossier : l'insérer au milieu obligerait à
  // décaler toutes les positions suivantes, pour un ordre que personne n'a
  // encore choisi.
  const last = await prisma.bookmark.findFirst({
    where: { userId: user.id, folderId: parsed.data.folderId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  await prisma.bookmark.update({
    where: { id: parsed.data.bookmarkId },
    data: {
      folderId: parsed.data.folderId,
      position: (last?.position ?? -1) + 1,
    },
  })

  revalidatePath('/')

  return { ok: true, message: '', previousFolderId: bookmark.folderId }
}
