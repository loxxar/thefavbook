/**
 * Client OpenRouter minimal.
 *
 * POURQUOI OpenRouter plutôt que l'API Google en direct : les paliers gratuits
 * se ferment sans prévenir — Flash n'est déjà plus ouvert aux nouveaux
 * comptes. Passer par un intermédiaire payant à l'usage rend le service
 * prévisible, pour quelques centimes sur une collection entière.
 *
 * POURQUOI `fetch` et pas un SDK : un seul point d'entrée, en sortie JSON
 * contrainte. Une dépendance de plus ne se justifie pas.
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Ranger des titres dans des dossiers ne demande pas un modèle de pointe.
 * Réglable par OPENROUTER_MODEL, sans redéploiement.
 */
const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

export class AiError extends Error {}

/** Quota ou débit dépassé : distinct d'une panne, l'appel réussira plus tard. */
export class AiQuotaError extends AiError {}

function readApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY

  if (key === undefined || key === '') {
    throw new AiError(
      'OPENROUTER_API_KEY est absente : le classement automatique est indisponible.',
    )
  }

  return key
}

export interface JsonSchema {
  type: string
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean
  description?: string
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string }
}

/**
 * Un appel, une réponse JSON conforme au schéma fourni.
 *
 * `data_collection: 'deny'` écarte les fournisseurs qui s'autorisent
 * l'entraînement sur les requêtes. Sans cette contrainte, la page de
 * confidentialité deviendrait invérifiable : on ne saurait plus qui traite les
 * données ni ce qu'il en fait.
 *
 * `require_parameters` écarte ceux qui ignorent `response_format` — mieux vaut
 * pas de réponse qu'une réponse hors schéma.
 */
export async function generateJson<T>(
  prompt: string,
  schemaName: string,
  schema: JsonSchema,
): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${readApiKey()}`,
      'Content-Type': 'application/json',
      // Identifie l'application dans les statistiques OpenRouter.
      'X-Title': 'thefavbook',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, strict: true, schema },
      },
      provider: {
        data_collection: 'deny',
        require_parameters: true,
      },
    }),
  })

  const payload = (await response.json()) as ChatResponse

  if (response.status === 429) {
    throw new AiQuotaError(
      'Débit dépassé chez le fournisseur. Reprise possible dans un instant.',
    )
  }

  if (response.status === 402) {
    throw new AiError(
      'Crédit OpenRouter épuisé. Rechargez le compte pour poursuivre.',
    )
  }

  if (!response.ok) {
    throw new AiError(
      payload.error?.message ?? `OpenRouter a répondu ${response.status}.`,
    )
  }

  const text = payload.choices?.[0]?.message?.content

  if (text === undefined || text === '') {
    throw new AiError('Réponse vide.')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new AiError('Réponse illisible.')
  }
}
