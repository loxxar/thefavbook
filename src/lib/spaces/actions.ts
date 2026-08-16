'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

/** Gestion des espaces : créer, renommer, supprimer. */

export interface SpaceResult {
  ok: boolean
  message: string
}

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Nom vide.')
  .max(60, 'Nom trop long.')

export async function createSpaceAction(name: string): Promise<SpaceResult> {
  const user = await requireUser()
  const parsed = nameSchema.safeParse(name)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Nom invalide.',
    }
  }

  const prisma = getPrisma()

  const existing = await prisma.space.findFirst({
    where: { userId: user.id, name: parsed.data },
    select: { id: true },
  })

  if (existing !== null) {
    return { ok: false, message: 'Un espace porte déjà ce nom.' }
  }

  const last = await prisma.space.findFirst({
    where: { userId: user.id },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  await prisma.space.create({
    data: {
      userId: user.id,
      name: parsed.data,
      position: (last?.position ?? -1) + 1,
    },
  })

  revalidatePath('/')

  return { ok: true, message: '' }
}

export async function renameSpaceAction(
  spaceId: string,
  name: string,
): Promise<SpaceResult> {
  const user = await requireUser()
  const parsed = nameSchema.safeParse(name)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Nom invalide.',
    }
  }

  const { count } = await getPrisma().space.updateMany({
    where: { id: spaceId, userId: user.id },
    data: { name: parsed.data },
  })

  if (count === 0) return { ok: false, message: 'Espace introuvable.' }

  revalidatePath('/')

  return { ok: true, message: '' }
}

/**
 * Supprime un espace et tout ce qu'il contient.
 *
 * POURQUOI cette suppression emporte le contenu, contrairement à celle d'un
 * dossier : un espace n'a pas de niveau supérieur où faire remonter ses
 * favoris. Les déplacer ailleurs mélangerait deux collections que
 * l'utilisateur avait justement séparées.
 *
 * Le dernier espace ne se supprime pas : l'application n'aurait plus rien où
 * écrire.
 */
export async function deleteSpaceAction(spaceId: string): Promise<SpaceResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const total = await prisma.space.count({ where: { userId: user.id } })

  if (total <= 1) {
    return {
      ok: false,
      message: 'Le dernier espace ne peut pas être supprimé.',
    }
  }

  const space = await prisma.space.findFirst({
    where: { id: spaceId, userId: user.id },
    select: { id: true },
  })

  if (space === null) return { ok: false, message: 'Espace introuvable.' }

  // La cascade emporte dossiers et favoris de cet espace, et rien d'autre.
  await prisma.space.delete({ where: { id: space.id } })

  revalidatePath('/')

  return { ok: true, message: '' }
}

/** Déplace un favori vers un autre espace, en le sortant de son dossier. */
export async function moveBookmarkToSpaceAction(
  bookmarkId: string,
  spaceId: string,
): Promise<SpaceResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const [bookmark, space] = await Promise.all([
    prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId: user.id },
      select: { id: true },
    }),
    prisma.space.findFirst({
      where: { id: spaceId, userId: user.id },
      select: { id: true },
    }),
  ])

  if (bookmark === null) return { ok: false, message: 'Favori introuvable.' }
  if (space === null) return { ok: false, message: 'Espace introuvable.' }

  // Le dossier appartenait à l'ancien espace : le garder ferait pointer le
  // favori vers une arborescence qui n'est plus la sienne.
  await prisma.bookmark.update({
    where: { id: bookmark.id },
    data: { spaceId: space.id, folderId: null },
  })

  revalidatePath('/')

  return { ok: true, message: '' }
}
