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
    // Tout sauf : les routes d'API, les assets Next et les fichiers statiques.
    //
    // POURQUOI exclure `/api` en entier : une redirection vers une page de
    // connexion n'a pas de sens pour un appel programmatique. `/api/auth` doit
    // rester joignable sans session — sinon impossible de se connecter — et
    // `/api/export` doit répondre 401 plutôt que de servir du HTML à la place
    // du fichier attendu. Chaque route d'API vérifie donc elle-même la session.
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
