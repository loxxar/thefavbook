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
    redirectsTo:
      final !== '' && final !== target.toString() ? final : null,
  }
}

/**
 * Un lien est jugé sain tant que le serveur ne dit pas le contraire.
 *
 * Les adresses hors de portée ne comptent pas comme mortes : on n'en sait
 * rien, et supprimer sur une ignorance serait pire que ne rien faire.
 */
export function isBroken(status: number | null): boolean {
  if (status === null || status === STATUS_UNVERIFIABLE) return false

  return status === 0 || status >= 400
}
