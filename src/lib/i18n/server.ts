import { cookies } from 'next/headers'

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from '@/lib/i18n/config'
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Langue à utiliser côté serveur.
 *
 * L'anglais est le point de départ pour tout le monde, sans consulter la
 * préférence du navigateur. POURQUOI : le produit s'adresse d'abord à un
 * public international — la page de soutien et le dépôt sont en anglais — et
 * une langue déduite de l'en-tête donnait à deux visiteurs deux versions
 * différentes du même lien, sans qu'aucun ne l'ait demandé.
 *
 * Le choix explicite prime et tient : quelqu'un qui a cliqué « Deutsch » ne
 * doit pas retrouver l'anglais au chargement suivant.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value

  return isLocale(chosen) ? chosen : DEFAULT_LOCALE
}

export async function getTranslations(): Promise<Dictionary> {
  return getDictionary(await getLocale())
}
