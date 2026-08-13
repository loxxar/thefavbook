import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Contrôle optimiste d'accès (Next 16 : `middleware.ts` s'appelle `proxy.ts`).
 *
 * On regarde uniquement si un cookie de session est **présent**. On ne le
 * valide pas : ce serait un appel base à chaque requête, et la documentation
 * Next déconseille explicitement de traiter l'autorisation ici.
 *
 * La vérification réelle vit dans `requireUser()` — un cookie forgé passe ce
 * proxy et se fait rejeter à la page suivante.
 */

const SIGN_IN_PATH = '/connexion'

export function proxy(request: NextRequest): NextResponse {
  const hasSessionCookie = getSessionCookie(request) !== null
  const isSignInPage = request.nextUrl.pathname === SIGN_IN_PATH

  if (!hasSessionCookie && !isSignInPage) {
    return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url))
  }

  if (hasSessionCookie && isSignInPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Tout sauf : les routes better-auth (elles doivent rester joignables
    // sans session, sinon impossible de se connecter), les assets Next et les
    // fichiers statiques.
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
