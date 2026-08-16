import type { PrismaClient } from '@/generated/prisma/client'

/**
 * Espace de travail courant.
 *
 * POURQUOI l'identifiant passe par l'adresse plutôt que par un cookie : l'état
 * reste visible, partageable, et deux onglets peuvent travailler sur deux
 * espaces sans se marcher dessus.
 *
 * Un identifiant inconnu — ou appartenant à quelqu'un d'autre — retombe
 * silencieusement sur l'espace par défaut. Le filtre sur `userId` est ici la
 * barrière qui empêche de lire la collection d'un autre compte.
 */

export interface SpaceSummary {
  id: string
  name: string
  isDefault: boolean
  bookmarkCount: number
}

export async function listSpaces(
  prisma: PrismaClient,
  userId: string,
): Promise<SpaceSummary[]> {
  const spaces = await prisma.space.findMany({
    where: { userId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      _count: { select: { bookmarks: true } },
    },
  })

  return spaces.map((s) => ({
    id: s.id,
    name: s.name,
    isDefault: s.isDefault,
    bookmarkCount: s._count.bookmarks,
  }))
}

/**
 * Résout l'espace à afficher, en en créant un si le compte n'en a aucun.
 *
 * La création de secours couvre les comptes nés avant les espaces et ceux dont
 * l'espace unique aurait été supprimé : sans elle, l'application n'aurait plus
 * rien où écrire.
 */
export async function resolveSpaceId(
  prisma: PrismaClient,
  userId: string,
  requested: string | undefined,
): Promise<string> {
  if (requested !== undefined && requested !== '') {
    const found = await prisma.space.findFirst({
      where: { id: requested, userId },
      select: { id: true },
    })

    if (found !== null) return found.id
  }

  const fallback = await prisma.space.findFirst({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
    select: { id: true },
  })

  if (fallback !== null) return fallback.id

  const created = await prisma.space.create({
    data: { userId, name: 'Mes favoris', isDefault: true },
    select: { id: true },
  })

  return created.id
}
