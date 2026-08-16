'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

/**
 * Gestion manuelle des dossiers.
 *
 * Sans elle, on ne peut que subir l'arborescence proposée par le classement
 * automatique : ni la corriger, ni la simplifier.
 */

export interface FolderResult {
  ok: boolean
  message: string
}

const nameSchema = z.string().trim().min(1, 'Nom vide.').max(120, 'Nom trop long.')

export async function renameFolderAction(
  folderId: string,
  name: string,
): Promise<FolderResult> {
  const user = await requireUser()
  const parsed = nameSchema.safeParse(name)

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Nom invalide.' }
  }

  // Le filtre sur userId est la seule barrière entre deux comptes.
  const { count } = await getPrisma().folder.updateMany({
    where: { id: folderId, userId: user.id },
    data: { name: parsed.data },
  })

  if (count === 0) return { ok: false, message: 'Dossier introuvable.' }

  revalidatePath('/')

  return { ok: true, message: '' }
}

/**
 * Supprime un dossier sans rien perdre de son contenu.
 *
 * POURQUOI remonter le contenu plutôt que le supprimer en cascade : la base
 * effacerait les sous-dossiers et détacherait les favoris vers la racine, où
 * ils se noieraient. Or l'outil promet qu'aucun favori ne disparaît — un
 * dossier supprimé doit rendre son contenu au niveau du dessus, pas le
 * dissoudre.
 */
export async function deleteFolderAction(
  folderId: string,
): Promise<FolderResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: user.id },
    select: { id: true, parentId: true },
  })

  if (folder === null) return { ok: false, message: 'Dossier introuvable.' }

  await prisma.$transaction(async (tx) => {
    await tx.bookmark.updateMany({
      where: { userId: user.id, folderId: folder.id },
      data: { folderId: folder.parentId },
    })

    await tx.folder.updateMany({
      where: { userId: user.id, parentId: folder.id },
      data: { parentId: folder.parentId },
    })

    // Les enfants ayant déjà changé de parent, la cascade n'emporte plus rien.
    await tx.folder.delete({ where: { id: folder.id } })
  })

  revalidatePath('/')

  return { ok: true, message: '' }
}

export async function createFolderAction(
  name: string,
  parentId: string | null,
): Promise<FolderResult> {
  const user = await requireUser()
  const parsed = nameSchema.safeParse(name)

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Nom invalide.' }
  }

  const prisma = getPrisma()

  if (parentId !== null) {
    const parent = await prisma.folder.findFirst({
      where: { id: parentId, userId: user.id },
      select: { id: true },
    })

    if (parent === null) return { ok: false, message: 'Dossier parent introuvable.' }
  }

  const existing = await prisma.folder.findFirst({
    where: { userId: user.id, parentId, name: parsed.data },
    select: { id: true },
  })

  if (existing !== null) {
    return { ok: false, message: 'Un dossier porte déjà ce nom ici.' }
  }

  const last = await prisma.folder.findFirst({
    where: { userId: user.id, parentId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  await prisma.folder.create({
    data: {
      userId: user.id,
      parentId,
      name: parsed.data,
      position: (last?.position ?? -1) + 1,
    },
  })

  revalidatePath('/')

  return { ok: true, message: '' }
}
