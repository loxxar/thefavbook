import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getAuth } from '@/lib/auth/server'
import { getPrisma } from '@/lib/db'

/**
 * Lecture de session côté serveur.
 *
 * C'est **ici** que se joue l'autorisation, pas dans `proxy.ts` : le proxy ne
 * constate que la présence d'un cookie, sans le valider. La documentation Next
 * est explicite là-dessus (voir la note « optimistic checks »).
 */

export interface SessionUser {
  id: string
  email: string
  name: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() })

  if (session === null) return null

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

/** Redirige vers la connexion si la session est absente ou invalide. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()

  if (user === null) redirect('/connexion')

  return user
}

/** Consentement à l'envoi des titres et URL au service de classement. */
export async function hasAiConsent(userId: string): Promise<boolean> {
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { aiConsentAt: true },
  })

  return user?.aiConsentAt != null
}
