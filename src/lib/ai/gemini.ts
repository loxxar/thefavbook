/**
 * Client Gemini minimal.
 *
 * POURQUOI `fetch` et pas le SDK officiel : on n'utilise qu'un seul point
 * d'entrée, `generateContent`, en sortie JSON contrainte. Une dépendance de
 * plus pour une trentaine de lignes ne se justifie pas.
 *
 * POURQUOI Gemini : le palier gratuit suffit largement à l'usage visé, et pour
 * un compte situé dans l'EEE les conditions payantes s'appliquent au palier
 * gratuit — les envois ne servent donc pas à entraîner les modèles. C'est ce
 * qui rend la page /confidentialite défendable.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Flash-Lite plutôt que Flash : c'est celui que le compte peut appeler, et il
 * offre le plafond gratuit le plus large (15 requêtes par minute, 1000 par
 * jour contre 250). La tâche — ranger des titres dans des dossiers — ne
 * demande pas le modèle le plus fin.
 *
 * Les modèles 2.5 sont annoncés pour extinction le 16 octobre 2026 : le nom
 * reste réglable par GEMINI_MODEL, sans redéploiement.
 */
const DEFAULT_MODEL = 'gemini-2.5-flash-lite'

export class GeminiError extends Error {}

/** Quota dépassé : distinct d'une panne, l'appel réussira plus tard. */
export class GeminiQuotaError extends GeminiError {}

function readApiKey(): string {
  const key = process.env.GEMINI_API_KEY

  if (key === undefined || key === '') {
    throw new GeminiError(
      "GEMINI_API_KEY est absente : le classement automatique est indisponible.",
    )
  }

  return key
}

/** Sous-ensemble d'OpenAPI accepté par `responseSchema`. */
export interface JsonSchema {
  type: string
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
  required?: string[]
  description?: string
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  error?: { message?: string }
}

/**
 * Un appel, une réponse JSON validée par le schéma fourni.
 *
 * `responseMimeType` contraint la sortie : pas de préambule bavard à découper,
 * pas de bloc Markdown à éplucher.
 */
export async function generateJson<T>(
  prompt: string,
  schema: JsonSchema,
): Promise<T> {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL

  const response = await fetch(
    `${ENDPOINT}/${model}:generateContent?key=${readApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
        },
      }),
    },
  )

  const payload = (await response.json()) as GeminiResponse

  if (response.status === 429) {
    throw new GeminiQuotaError(
      'Quota Gemini atteint. Le palier gratuit autorise 10 requêtes par minute et 250 par jour.',
    )
  }

  if (!response.ok) {
    throw new GeminiError(
      payload.error?.message ?? `Gemini a répondu ${response.status}.`,
    )
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text

  if (text === undefined) {
    throw new GeminiError('Réponse Gemini vide.')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError('Réponse Gemini illisible.')
  }
}
