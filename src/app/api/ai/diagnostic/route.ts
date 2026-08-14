import { getSessionUser } from '@/lib/auth/session'

/**
 * Diagnostic du classement automatique.
 *
 * Tente un appel minimal avec la clé du serveur et renvoie la réponse brute du
 * fournisseur. Évite d'avoir à manipuler la clé à la main pour comprendre un
 * refus — crédit épuisé, modèle inconnu, débit dépassé.
 *
 * Réservé aux comptes connectés : le résultat n'a rien de secret, mais
 * l'existence et la validité de la clé, si.
 */
export async function GET(): Promise<Response> {
  const user = await getSessionUser()

  if (user === null) {
    return new Response('Non autorisé.', { status: 401 })
  }

  const key = process.env.OPENROUTER_API_KEY

  if (key === undefined || key === '') {
    return Response.json(
      { erreur: 'OPENROUTER_API_KEY absente côté serveur.' },
      { status: 500 },
    )
  }

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash-lite'

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'X-Title': 'thefavbook',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Réponds exactement : ok' }],
      max_tokens: 5,
      provider: { data_collection: 'deny', require_parameters: true },
    }),
  })

  const payload: unknown = await response.json()

  return Response.json(
    {
      modeleConfigure: model,
      statut: response.status,
      reponse: resume(payload),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function resume(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return 'réponse illisible'

  const error = (payload as { error?: { message?: unknown } }).error

  if (typeof error?.message === 'string') return error.message

  const content = (
    payload as { choices?: { message?: { content?: unknown } }[] }
  ).choices?.[0]?.message?.content

  return typeof content === 'string' ? `ok — « ${content} »` : 'réponse vide'
}
