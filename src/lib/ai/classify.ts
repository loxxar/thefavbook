import { generateJson, type JsonSchema } from '@/lib/ai/gemini'

/**
 * Classement d'un lot de favoris.
 *
 * POURQUOI pas de passe « taxonomie » séparée : chaque lot reçoit les dossiers
 * déjà connus et doit les réutiliser en priorité. L'arborescence se stabilise
 * d'elle-même au fil des lots, sans table intermédiaire ni état à faire vivre
 * entre deux requêtes.
 *
 * Ce qui sort d'ici : un titre et une URL par favori. Jamais le contenu des
 * pages, jamais l'adresse e-mail du compte.
 */

export const CLASSIFY_BATCH_SIZE = 100

export interface BookmarkToClassify {
  id: string
  title: string
  url: string
}

export interface ClassifiedBookmark {
  id: string
  folderPath: string
  title: string | null
  reason: string | null
}

const responseSchema: JsonSchema = {
  type: 'object',
  properties: {
    assignments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: "Identifiant fourni en entrée" },
          folderPath: {
            type: 'string',
            description: 'Chemin du dossier, niveaux séparés par " / "',
          },
          title: {
            type: 'string',
            description: 'Titre réécrit, ou chaîne vide si celui d’origine convient',
          },
          reason: { type: 'string', description: 'Justification en une ligne' },
        },
        required: ['id', 'folderPath', 'reason'],
      },
    },
  },
  required: ['assignments'],
}

function buildPrompt(
  bookmarks: readonly BookmarkToClassify[],
  knownFolders: readonly string[],
): string {
  const folders =
    knownFolders.length > 0
      ? knownFolders.map((f) => `- ${f}`).join('\n')
      : '(aucun pour l’instant, proposez une arborescence)'

  const items = bookmarks
    .map((b) => `${b.id}\t${b.title || '(sans titre)'}\t${b.url}`)
    .join('\n')

  return `Tu ranges des favoris de navigateur dans une arborescence de dossiers.

Dossiers déjà existants, à réutiliser en priorité :
${folders}

Règles :
- Réutilise un dossier existant dès qu'il convient, même approximativement.
- N'en crée un nouveau que si aucun ne convient vraiment.
- Deux niveaux au maximum, séparés par " / ". Exemple : "Développement / Documentation".
- Les noms de dossiers sont en français, courts, au pluriel quand c'est naturel.
- Vise entre 10 et 30 dossiers au total pour une collection entière.
- Si le titre est inexploitable ("Untitled", "Home", "(1) ...", une suite de
  chiffres), propose un titre clair déduit de l'URL. Sinon, renvoie une chaîne vide.
- Justifie chaque rangement en une ligne, en français.

Favoris à ranger, un par ligne, au format identifiant, titre puis URL séparés
par une tabulation :
${items}`
}

export async function classifyBookmarks(
  bookmarks: readonly BookmarkToClassify[],
  knownFolders: readonly string[],
): Promise<ClassifiedBookmark[]> {
  if (bookmarks.length === 0) return []

  const result = await generateJson<{
    assignments: {
      id: string
      folderPath: string
      title?: string
      reason: string
    }[]
  }>(buildPrompt(bookmarks, knownFolders), responseSchema)

  const wanted = new Set(bookmarks.map((b) => b.id))

  return result.assignments
    // Le modèle peut inventer un identifiant : on ne garde que ceux envoyés.
    .filter((a) => wanted.has(a.id) && a.folderPath.trim() !== '')
    .map((a) => ({
      id: a.id,
      folderPath: a.folderPath.trim(),
      title: a.title !== undefined && a.title.trim() !== '' ? a.title.trim() : null,
      reason: a.reason.trim() === '' ? null : a.reason.trim(),
    }))
}
