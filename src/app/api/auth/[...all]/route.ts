import { getAuth } from '@/lib/auth/server'

/**
 * Point d'entrée de toutes les routes better-auth.
 *
 * L'instance est résolue à la requête, pas au chargement du module : voir le
 * commentaire de `getAuth`.
 */

export async function GET(request: Request): Promise<Response> {
  return getAuth().handler(request)
}

export async function POST(request: Request): Promise<Response> {
  return getAuth().handler(request)
}
