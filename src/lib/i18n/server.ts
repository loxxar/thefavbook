import { cookies, headers } from 'next/headers'

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  matchLocale,
  type Locale,
} from '@/lib/i18n/config'
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Langue à utiliser côté serveur.
 *
 * Le choix explicite prime sur la préférence du navigateur : quelqu'un qui a
 * cliqué « Deutsch » ne veut pas voir l'anglais réapparaître au prochain
 * chargement.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value

  if (isLocale(chosen)) return chosen

  const accept = (await headers()).get('accept-language')

  return accept === null ? DEFAULT_LOCALE : matchLocale(accept)
}

export async function getTranslations(): Promise<Dictionary> {
  return getDictionary(await getLocale())
}
