import { assertFetchable, PreviewError } from '@/lib/preview/opengraph'

/**
 * Vérification de l'état d'un lien.
 *
 * POURQUOI un HEAD d'abord : il suffit à connaître le sort d'une page sans en
 * télécharger le corps. Beaucoup de serveurs le refusent pourtant, d'où le
 * repli en GET — dont on abandonne la lecture dès les en-têtes reçus.
 *
 * Les mêmes garde-fous que l'aperçu s'appliquent : l'adresse vient de
 * l'utilisateur, et le serveur n'a pas à sonder le réseau interne de
 * l'hébergeur.
 */

/**
 * Adresse hors de portée : schéma interne au navigateur (`chrome://`), hôte
 * local, réseau privé.
 *
 * Distinct de 0, qui signale un serveur muet. Les confondre ferait supprimer
 * des favoris parfaitement valides lors d'un nettoyage en masse.
 */
export const STATUS_UNVERIFIABLE = -1

export interface LinkStatus {
  /** Code HTTP, 0 si le serveur n'a pas répondu, -1 si hors de portée. */
  status: number
  /** Adresse finale après redirections, si elle diffère. */
  redirectsTo: string | null
}

const TIMEOUT_MS = 8000

/** Au-delà, on sature la fonction et les serveurs visités. */
export const CHECK_BATCH_SIZE = 20

export async function checkLink(rawUrl: string): Promise<LinkStatus> {
  let target: URL

  try {
    target = assertFetchable(rawUrl)
  } catch (error) {
    // Une adresse impossible à visiter n'est pas un lien mort : elle est hors
    // de portée, et le nettoyage doit l'épargner.
    if (error instanceof PreviewError) {
      return { status: STATUS_UNVERIFIABLE, redirectsTo: null }
    }
    throw error
  }

  const options: RequestInit = {
    headers: {
      'User-Agent': 'thefavbook/1.0 (vérification de lien)',
      Accept: '*/*',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  }

  let response: Response | null = null

  try {
    response = await fetch(target, { ...options, method: 'HEAD' })

    // 405 et 501 signalent un serveur qui ignore HEAD, pas une page absente.
    if (response.status === 405 || response.status === 501) {
      response = await fetch(target, { ...options, method: 'GET' })
    }
  } catch {
    try {
      response = await fetch(target, { ...options, method: 'GET' })
    } catch {
      return { status: 0, redirectsTo: null }
    }
  }

  const final = response.url

  return {
    status: response.status,
    redirectsTo: final !== '' && final !== target.toString() ? final : null,
  }
}

/**
 * Les deux seuls codes par lesquels un serveur déclare qu'une page n'existe
 * pas : 404 introuvable, 410 retirée définitivement.
 *
 * POURQUOI pas tout le 4xx : un 401, un 403 ou un 429 disent « je ne te
 * réponds pas à toi » — le site est vivant, il refuse un robot. Cloudflare et
 * les murs de connexion en produisent en masse. Les traiter comme des liens
 * morts faisait proposer la suppression de favoris parfaitement valides, à
 * hauteur de douze sur quatorze sur une collection réelle.
 *
 * POURQUOI pas le 5xx : une panne se répare. Un lien n'est pas mort parce que
 * son serveur a hoqueté pendant la vérification.
 */
const BROKEN_STATUSES = [404, 410]

/**
 * Filtre Prisma des favoris réellement morts.
 *
 * Partagé par le comptage et par la suppression : les voir diverger ferait
 * effacer autre chose que ce qui était annoncé.
 */
export const BROKEN_WHERE = { checkStatus: { in: BROKEN_STATUSES } }

/**
 * Un lien n'est mort que si le serveur l'a dit lui-même.
 *
 * Tout le reste — hors de portée, muet, bloqué, en panne — relève de
 * l'ignorance, et supprimer sur une ignorance serait pire que ne rien faire.
 */
export function isBroken(status: number | null): boolean {
  if (status === null) return false

  return BROKEN_STATUSES.includes(status)
}

/**
 * Le serveur a répondu, mais rien n'a pu être conclu : accès refusé, quota
 * atteint, panne, silence, ou adresse hors de portée.
 *
 * Signalé à l'utilisateur sans jamais être proposé à la suppression.
 */
export function isInconclusive(status: number | null): boolean {
  if (status === null || isBroken(status)) return false

  return status === STATUS_UNVERIFIABLE || status === 0 || status >= 400
}
