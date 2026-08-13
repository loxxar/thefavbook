import { getSessionUser } from '@/lib/auth/session'
import { exportNetscapeBookmarks } from '@/lib/bookmarks/export'
import { readBookmarkTree } from '@/lib/bookmarks/tree'
import { getPrisma } from '@/lib/db'

/**
 * Export au format Netscape, téléchargeable et réimportable dans n'importe
 * quel navigateur.
 *
 * POURQUOI une route et pas une Server Action : il s'agit de renvoyer un
 * fichier avec ses en-têtes, pas de muter quoi que ce soit.
 */
export async function GET(): Promise<Response> {
  const user = await getSessionUser()

  // Pas de redirection ici : une route de fichier répond en HTTP, elle ne
  // renvoie pas vers une page de connexion.
  if (user === null) {
    return new Response('Non autorisé.', { status: 401 })
  }

  const nodes = await readBookmarkTree(getPrisma(), user.id)
  const html = exportNetscapeBookmarks(nodes, { title: 'Bookmarks' })

  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="favoris-${stamp}.html"`,
      'Cache-Control': 'no-store',
    },
  })
}
