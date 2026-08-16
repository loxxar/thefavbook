import { getSessionUser } from '@/lib/auth/session'
import { fetchPagePreview, PreviewError } from '@/lib/preview/opengraph'

/**
 * Aperçu d'une page, à la demande.
 *
 * Le serveur ne consulte une page que lorsqu'un utilisateur connecté clique
 * sur un favori, et n'en conserve rien — ni le contenu, ni l'image, ni la
 * moindre trace en base.
 *
 * Réservé aux comptes connectés : sinon l'application deviendrait un relais
 * anonyme pour aller chercher n'importe quelle adresse.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getSessionUser()

  if (user === null) {
    return new Response('Non autorisé.', { status: 401 })
  }

  const target = new URL(request.url).searchParams.get('url')

  if (target === null || target === '') {
    return Response.json({ erreur: 'Adresse manquante.' }, { status: 400 })
  }

  try {
    const preview = await fetchPagePreview(target)

    return Response.json(preview, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return Response.json(
      {
        erreur:
          error instanceof PreviewError
            ? error.message
            : 'Aperçu indisponible.',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
