import { getPrisma } from '@/lib/db'

/**
 * Réception des soutiens Ko-fi.
 *
 * Ko-fi n'expose pas d'API interrogeable : il pousse un webhook, et c'est
 * tout. Impossible de relire l'historique — si cette route tombe, les dons de
 * cette période n'existeront jamais ici. C'est pourquoi le compteur n'a qu'un
 * rôle d'affichage, et ne débloque aucun droit.
 *
 * Ko-fi envoie du `application/x-www-form-urlencoded` avec un unique champ
 * `data` contenant du JSON.
 */

interface KofiPayload {
  verification_token?: string
  message_id?: string
  kofi_transaction_id?: string
  type?: string
  amount?: string
  currency?: string
  from_name?: string
  message?: string
  is_public?: boolean
}

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.KOFI_VERIFICATION_TOKEN

  if (expected === undefined || expected === '') {
    return new Response('Webhook non configuré.', { status: 503 })
  }

  let payload: KofiPayload

  try {
    const form = await request.formData()
    const raw = form.get('data')

    if (typeof raw !== 'string') {
      return new Response('Champ data absent.', { status: 400 })
    }

    payload = JSON.parse(raw) as KofiPayload
  } catch {
    return new Response('Corps illisible.', { status: 400 })
  }

  if (payload.verification_token !== expected) {
    return new Response('Jeton invalide.', { status: 401 })
  }

  // `message_id` sert de repli : les commandes boutique n'ont pas toujours
  // d'identifiant de transaction.
  const transactionId = payload.kofi_transaction_id ?? payload.message_id

  if (transactionId === undefined) {
    return new Response('Transaction sans identifiant.', { status: 400 })
  }

  const isPublic = payload.is_public === true

  await getPrisma().support.upsert({
    where: { kofiTransactionId: transactionId },
    // Le webhook peut être rejoué : on ne compte jamais deux fois.
    update: {},
    create: {
      kofiTransactionId: transactionId,
      type: payload.type ?? 'Donation',
      amount: payload.amount ?? '0',
      currency: payload.currency ?? 'EUR',
      // Rien n'est affiché sans accord explicite du donateur, et l'adresse
      // e-mail transmise par Ko-fi n'est jamais enregistrée.
      fromName: isPublic ? (payload.from_name ?? null) : null,
      message: isPublic ? (payload.message ?? null) : null,
    },
  })

  return new Response('ok')
}
