import { getSessionUser } from '@/lib/auth/session'

/**
 * Diagnostic du classement automatique.
 *
 * Interroge Google avec la clé du serveur pour savoir quels modèles elle
 * autorise réellement, puis tente un appel minimal. Évite d'avoir à manipuler
 * la clé à la main pour comprendre un refus.
 *
 * Réservé aux comptes connectés : la liste des modèles n'a rien de secret,
 * mais l'existence et la validité de la clé, si.
 */
export async function GET(): Promise<Response> {
  const user = await getSessionUser()

  if (user === null) {
    return new Response('Non autorisé.', { status: 401 })
  }

  const key = process.env.GEMINI_API_KEY

  if (key === undefined || key === '') {
    return Response.json(
      { erreur: 'GEMINI_API_KEY absente côté serveur.' },
      { status: 500 },
    )
  }

  const configured = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
  const base = 'https://generativelanguage.googleapis.com/v1beta'

  const listResponse = await fetch(`${base}/models?key=${key}&pageSize=200`)
  const listPayload: unknown = await listResponse.json()

  const models = extractModels(listPayload)

  // Un appel minimal sur le modèle configuré : la liste peut annoncer un
  // modèle que le compte n'a pas le droit d'appeler.
  const testResponse = await fetch(
    `${base}/models/${configured}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
    },
  )

  const testPayload: unknown = await testResponse.json()

  return Response.json(
    {
      modeleConfigure: configured,
      listeStatut: listResponse.status,
      modelesDisponibles: models,
      appelTestStatut: testResponse.status,
      appelTestReponse: extractError(testPayload) ?? 'ok',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

/** Ne garde que les modèles capables de répondre à `generateContent`. */
function extractModels(payload: unknown): string[] {
  if (typeof payload !== 'object' || payload === null) return []

  const list = (payload as { models?: unknown }).models

  if (!Array.isArray(list)) return []

  return list
    .filter((m): m is { name: string; supportedGenerationMethods?: string[] } => {
      if (typeof m !== 'object' || m === null) return false
      const methods = (m as { supportedGenerationMethods?: unknown })
        .supportedGenerationMethods
      return (
        typeof (m as { name?: unknown }).name === 'string' &&
        (!Array.isArray(methods) || methods.includes('generateContent'))
      )
    })
    .map((m) => m.name.replace('models/', ''))
}

function extractError(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null

  const error = (payload as { error?: { message?: unknown } }).error

  return typeof error?.message === 'string' ? error.message : null
}
