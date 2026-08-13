/**
 * Normalisation d'URL pour le dédoublonnage.
 *
 * POURQUOI : le même lien récolté sur 4 navigateurs arrive sous 4 formes
 * (http/https, avec ou sans www, slash final, paramètres de tracking collés
 * par un partage). On dérive une clé canonique stable pour les regrouper,
 * SANS jamais réécrire l'URL d'origine, qui reste la seule source de vérité.
 */

/** Paramètres purement analytiques : leur présence ne change pas la page servie. */
const TRACKING_PARAMS = new Set([
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'twclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'ref_url',
  'referrer',
  'source',
  'spm',
  'yclid',
  '_ga',
  '_gl',
  'vero_id',
  'vero_conv',
  'hsa_cam',
  'hsa_grp',
  'hsa_ad',
  'trk',
  'trkCampaign',
  'sc_cid',
  'oly_anon_id',
  'oly_enc_id',
  'si',
])

const TRACKING_PREFIXES = ['utm_', 'pk_', 'piwik_', 'matomo_', 'at_', 'ns_']

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase()
  if (TRACKING_PARAMS.has(lower)) return true
  return TRACKING_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

/**
 * Clé de dédoublonnage. Deux favoris qui partagent cette clé pointent, à de
 * rares exceptions près, vers la même page.
 *
 * Renvoie une chaîne normalisée pour http(s). Pour les autres schémas
 * (javascript:, place:, chrome:, file:) l'entrée est seulement compactée :
 * on ne sait pas les interpréter, on ne prend pas le risque de les fusionner.
 */
export function canonicalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    // URL non parsable : on garde une forme compacte plutôt que d'échouer,
    // sinon un favori mal formé serait silencieusement perdu au dédoublonnage.
    return trimmed.toLowerCase()
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== 'http:' && protocol !== 'https:') {
    return `${protocol}${parsed.pathname}${parsed.search}`.toLowerCase()
  }

  // http et https de la même page sont volontairement fusionnés : c'est
  // presque toujours le même contenu, et c'est un doublon fréquent.
  let host = parsed.hostname.toLowerCase()
  if (host.startsWith('www.')) host = host.slice(4)

  const port =
    parsed.port === '' || parsed.port === '80' || parsed.port === '443'
      ? ''
      : `:${parsed.port}`

  let path = parsed.pathname
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  if (path === '') path = '/'

  const params = [...parsed.searchParams.entries()]
    .filter(([name]) => !isTrackingParam(name))
    .sort(([a, aVal], [b, bVal]) => a.localeCompare(b) || aVal.localeCompare(bVal))

  const search =
    params.length > 0
      ? `?${params.map(([k, v]) => `${k}=${v}`).join('&')}`
      : ''

  // Le fragment est ignoré, SAUF le hashbang qui, sur les vieilles SPA,
  // désigne une route distincte et donc une page réellement différente.
  const hash = parsed.hash.startsWith('#!') ? parsed.hash : ''

  return `https://${host}${port}${path}${search}${hash}`
}

/** Domaine enregistrable approximatif, utilisé pour grouper et pour les règles de classement. */
export function extractHostname(raw: string): string | null {
  try {
    const host = new URL(raw.trim()).hostname.toLowerCase()
    return host.startsWith('www.') ? host.slice(4) : host || null
  } catch {
    return null
  }
}
