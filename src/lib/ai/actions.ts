'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/session'
import { CLASSIFY_BATCH_SIZE, classifyBookmarks } from '@/lib/ai/classify'
import { AiError, AiQuotaError } from '@/lib/ai/openrouter'
import type { ClassifyBatchResult } from '@/lib/ai/state'
import { findStyle } from '@/lib/ai/styles'
import { getPrisma } from '@/lib/db'

/**
 * Classe un lot de favoris et s'arrête.
 *
 * POURQUOI un lot par appel plutôt qu'une passe complète : le palier gratuit
 * plafonne à 10 requêtes par minute, et une fonction Vercel à 300 secondes.
 * Enchaîner 41 lots dans une seule requête dépasserait les deux. Le client
 * rappelle donc cette action jusqu'à épuisement — ce qui donne au passage une
 * progression réelle plutôt qu'une jauge indéterminée.
 */
export async function classifyNextBatchAction(
  styleId: string,
  spaceId: string,
): Promise<ClassifyBatchResult> {
  const user = await requireUser()
  const prisma = getPrisma()

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { aiConsentAt: true },
  })

  // Deuxième barrière : l'interface masque le bouton, mais une action serveur
  // reste appelable directement.
  if (account?.aiConsentAt == null) {
    return {
      status: 'error',
      message: "Le classement automatique n'a pas été autorisé.",
      classified: 0,
      remaining: 0,
      samples: [],
    }
  }

  const pending = await prisma.bookmark.findMany({
    where: { userId: user.id, spaceId, suggestion: { is: null } },
    select: { id: true, title: true, url: true },
    take: CLASSIFY_BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  })

  if (pending.length === 0) {
    return {
      status: 'done',
      message: 'Tous les favoris ont été analysés.',
      classified: 0,
      remaining: 0,
      samples: [],
    }
  }

  // Les dossiers déjà en place et ceux déjà proposés forment la cible : c'est
  // ce qui empêche l'arborescence de diverger d'un lot à l'autre.
  const [folders, suggested] = await Promise.all([
    prisma.folder.findMany({
      where: { userId: user.id, spaceId },
      select: { name: true },
      distinct: ['name'],
      take: 60,
    }),
    prisma.suggestion.findMany({
      where: { userId: user.id, bookmark: { spaceId } },
      select: { folderPath: true },
      distinct: ['folderPath'],
      take: 60,
    }),
  ])

  const knownFolders = [
    ...new Set([
      ...suggested.map((s) => s.folderPath),
      ...folders.map((f) => f.name),
    ]),
  ]

  try {
    const assignments = await classifyBookmarks(
      pending,
      knownFolders,
      // `findStyle` retombe sur le style par défaut : un identifiant inconnu
      // ne doit pas faire échouer l'analyse.
      findStyle(styleId),
    )

    if (assignments.length > 0) {
      await prisma.suggestion.createMany({
        data: assignments.map((a) => ({
          userId: user.id,
          bookmarkId: a.id,
          folderPath: a.folderPath,
          title: a.title,
          reason: a.reason,
        })),
        skipDuplicates: true,
      })
    }

    const remaining = await prisma.bookmark.count({
      where: { userId: user.id, spaceId, suggestion: { is: null } },
    })

    revalidatePath('/')

    // Le titre d'origine sert de repli : le modèle ne réécrit que ceux qui
    // sont inexploitables.
    const originalTitles = new Map(pending.map((b) => [b.id, b.title]))

    return {
      status: remaining === 0 ? 'done' : 'running',
      message: '',
      classified: assignments.length,
      remaining,
      samples: assignments.map((a) => ({
        title: a.title ?? originalTitles.get(a.id) ?? '(sans titre)',
        folderPath: a.folderPath,
      })),
    }
  } catch (error) {
    const remaining = await prisma.bookmark.count({
      where: { userId: user.id, spaceId, suggestion: { is: null } },
    })

    // Un quota n'est pas une panne : les favoris déjà classés sont acquis et
    // l'appel réussira plus tard. Le client peut donc patienter et reprendre.
    if (error instanceof AiQuotaError) {
      return {
        status: 'quota',
        message: error.message,
        classified: 0,
        remaining,
        samples: [],
      }
    }

    return {
      status: 'error',
      message:
        error instanceof AiError
          ? error.message
          : "Le service de classement n'a pas répondu.",
      classified: 0,
      remaining,
      samples: [],
    }
  }
}

/** Applique une suggestion : crée les dossiers manquants et déplace le favori. */
export async function acceptSuggestionAction(
  suggestionId: string,
): Promise<void> {
  const user = await requireUser()
  const prisma = getPrisma()

  const suggestion = await prisma.suggestion.findFirst({
    where: { id: suggestionId, userId: user.id, status: 'PENDING' },
    include: { bookmark: { select: { spaceId: true } } },
  })

  if (suggestion === null) return

  // Les dossiers naissent dans l'espace du favori, jamais ailleurs.
  const spaceId = suggestion.bookmark.spaceId
  let parentId: string | null = null

  // Le chemin est créé niveau par niveau, en réutilisant ce qui existe déjà.
  for (const name of suggestion.folderPath.split('/').map((p) => p.trim())) {
    if (name === '') continue

    const existing: { id: string } | null = await prisma.folder.findFirst({
      where: { userId: user.id, spaceId, parentId, name },
      select: { id: true },
    })

    if (existing !== null) {
      parentId = existing.id
      continue
    }

    const created: { id: string } = await prisma.folder.create({
      data: { userId: user.id, spaceId, parentId, name },
      select: { id: true },
    })
    parentId = created.id
  }

  await prisma.bookmark.update({
    where: { id: suggestion.bookmarkId },
    data: {
      folderId: parentId,
      ...(suggestion.title !== null ? { title: suggestion.title } : {}),
    },
  })

  await prisma.suggestion.update({
    where: { id: suggestion.id },
    data: { status: 'ACCEPTED', decidedAt: new Date() },
  })

  revalidatePath('/')
}

export async function rejectSuggestionAction(
  suggestionId: string,
): Promise<void> {
  const user = await requireUser()

  await getPrisma().suggestion.updateMany({
    where: { id: suggestionId, userId: user.id, status: 'PENDING' },
    data: { status: 'REJECTED', decidedAt: new Date() },
  })

  revalidatePath('/')
}

/** Accepte toutes les suggestions en attente, une par une. */
export async function acceptAllSuggestionsAction(): Promise<number> {
  const user = await requireUser()

  const pending = await getPrisma().suggestion.findMany({
    where: { userId: user.id, status: 'PENDING' },
    select: { id: true },
  })

  for (const { id } of pending) {
    await acceptSuggestionAction(id)
  }

  return pending.length
}

/**
 * Efface les propositions en attente.
 *
 * Sert à repartir d'une page blanche quand on change de style : mêler deux
 * logiques de rangement produirait une arborescence bâtarde, moitié par thème
 * moitié par plateforme.
 *
 * Les propositions déjà acceptées ne sont pas touchées — les favoris ont été
 * déplacés, revenir dessus serait une autre opération.
 */
export async function clearPendingSuggestionsAction(): Promise<number> {
  const user = await requireUser()

  const { count } = await getPrisma().suggestion.deleteMany({
    where: { userId: user.id, status: 'PENDING' },
  })

  revalidatePath('/')

  return count
}
