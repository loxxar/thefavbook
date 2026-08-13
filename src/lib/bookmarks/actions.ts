'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { importBookmarks } from '@/lib/bookmarks/import'
import {
  MAX_FILE_BYTES,
  type ImportActionState,
  type ImportedFileSummary,
} from '@/lib/bookmarks/import-state'
import { parseNetscapeBookmarks } from '@/lib/bookmarks/parse'
import { countBookmarks } from '@/lib/bookmarks/types'
import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, 'Fichier vide.')
  .refine(
    (f) => f.size <= MAX_FILE_BYTES,
    `Fichier trop volumineux (maximum ${MAX_FILE_BYTES / 1024 / 1024} Mo).`,
  )

const importSchema = z.object({
  files: z.array(fileSchema).min(1, 'Choisissez au moins un fichier.'),
  sourceLabel: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === '' ? null : v)),
})

/**
 * Import d'un ou plusieurs fichiers de favoris.
 *
 * Chaque fichier est importé dans sa propre transaction : si le troisième
 * échoue, les deux premiers restent acquis. Tout annuler obligerait à tout
 * recommencer pour un fichier fautif, alors que `ImportBatch` permet déjà de
 * défaire un import précis.
 */
export async function importBookmarksAction(
  _previous: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const user = await requireUser()

  const parsed = importSchema.safeParse({
    files: formData.getAll('files'),
    sourceLabel: formData.get('sourceLabel') ?? '',
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Fichier invalide.',
      imported: [],
    }
  }

  const prisma = getPrisma()
  const imported: ImportedFileSummary[] = []

  for (const file of parsed.data.files) {
    const html = await file.text()
    const nodes = parseNetscapeBookmarks(html)

    if (countBookmarks(nodes) === 0) {
      return {
        status: 'error',
        message: `Aucun favori trouvé dans « ${file.name} ». Est-ce bien un export de navigateur ?`,
        imported,
      }
    }

    const result = await importBookmarks(prisma, {
      userId: user.id,
      fileName: file.name,
      sourceLabel: parsed.data.sourceLabel,
      nodes,
    })

    imported.push({
      fileName: file.name,
      bookmarks: result.bookmarkCount,
      folders: result.folderCount,
    })
  }

  revalidatePath('/')

  const total = imported.reduce((sum, i) => sum + i.bookmarks, 0)

  return {
    status: 'success',
    message: `${total} favori${total > 1 ? 's' : ''} importé${total > 1 ? 's' : ''}.`,
    imported,
  }
}
