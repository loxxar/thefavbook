import { Parser } from 'htmlparser2'

/**
 * Récupération des métadonnées de partage d'une page.
 *
 * POURQUOI OpenGraph plutôt qu'une capture d'écran : les sites publient ces
 * balises exprès pour être partagés. Une seule requête HTTP suffit, sans
 * navigateur sans interface, sans service tiers, et sans les trois heures
 * qu'exigerait la capture de plusieurs milliers de pages.
 *
 * Rien n'est enregistré : la réponse sert à l'affichage puis disparaît.
 */

export interface PagePreview {
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
}

/** Au-delà, on a largement dépassé le `<head>` : inutile de lire la suite. */
const MAX_BYTES = 256 * 1024
const TIMEOUT_MS = 6000

export class PreviewError extends Error {}

/**
 * Hôtes que le serveur ne doit jamais aller consulter.
 *
 * L'adresse vient de l'utilisateur : sans ce garde-fou, l'application
 * deviendrait un relais pour sonder le réseau interne de l'hébergeur.
 */
function isForbiddenHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')

  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd'))
    return true
  if (host.endsWith('.internal') || host.endsWith('.local')) return true

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)

  if (ipv4 === null) return false

  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

export function assertFetchable(raw: string): URL {
  let url: URL

  try {
    url = new URL(raw)
  } catch {
    throw new PreviewError('Adresse invalide.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PreviewError(
      'Seules les adresses http et https sont consultables.',
    )
  }

  if (isForbiddenHost(url.hostname)) {
    throw new PreviewError('Adresse non consultable.')
  }

  return url
}

/** Lit au plus MAX_BYTES, puis coupe la connexion. */
async function readHead(response: Response): Promise<string> {
  const reader = response.body?.getReader()

  if (reader === undefined) return ''

  const decoder = new TextDecoder()
  const chunks: string[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break

    total += value.byteLength
    chunks.push(decoder.decode(value, { stream: true }))

    if (total >= MAX_BYTES) {
      await reader.cancel()
      break
    }
  }

  return chunks.join('')
}

/** Extrait les balises utiles sans reconstruire l'arbre du document. */
function extractMeta(html: string, base: URL): PagePreview {
  const meta = new Map<string, string>()
  let documentTitle: string | null = null
  let inTitle = false

  const parser = new Parser({
    onopentag(name, attributes) {
      if (name === 'title') {
        inTitle = true
        return
      }

      if (name !== 'meta') return

      const key = attributes.property ?? attributes.name
      const content = attributes.content

      if (key !== undefined && content !== undefined && !meta.has(key)) {
        meta.set(key.toLowerCase(), content)
      }
    },
    ontext(text) {
      if (inTitle && documentTitle === null) documentTitle = text.trim()
    },
    onclosetag(name) {
      if (name === 'title') inTitle = false
    },
  })

  parser.write(html)
  parser.end()

  const rawImage = meta.get('og:image') ?? meta.get('twitter:image') ?? null

  let imageUrl: string | null = null

  if (rawImage !== null) {
    try {
      // Les balises portent souvent un chemin relatif.
      imageUrl = new URL(rawImage, base).toString()
    } catch {
      imageUrl = null
    }
  }

  const title = meta.get('og:title') ?? documentTitle
  const description =
    meta.get('og:description') ?? meta.get('description') ?? null

  return {
    title: title !== undefined && title !== '' ? title : null,
    description: description !== '' ? description : null,
    imageUrl,
    siteName: meta.get('og:site_name') ?? null,
  }
}

export async function fetchPagePreview(rawUrl: string): Promise<PagePreview> {
  const url = assertFetchable(rawUrl)

  let response: Response

  try {
    response = await fetch(url, {
      headers: {
        // Se présenter honnêtement : un site qui ne veut pas être lu doit
        // pouvoir le refuser.
        'User-Agent': 'thefavbook/1.0 (aperçu de favori)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch {
    throw new PreviewError('Le site n’a pas répondu.')
  }

  if (!response.ok) {
    throw new PreviewError(`Le site a répondu ${response.status}.`)
  }

  const type = response.headers.get('content-type') ?? ''

  if (!type.includes('html')) {
    throw new PreviewError('La page n’est pas un document HTML.')
  }

  return extractMeta(await readHead(response), new URL(response.url))
}
