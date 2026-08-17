/**
 * Langues de l'interface.
 *
 * POURQUOI un dictionnaire maison plutôt qu'une bibliothèque : l'application
 * n'a ni pluriels complexes, ni formats de dates localisés au-delà de ce que
 * `Intl` fournit déjà, ni chargement différé à gérer. Une dépendance
 * apporterait surtout de la configuration.
 */

export const LOCALES = ['fr', 'en', 'de', 'es'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Nom de chaque langue dans sa propre langue : c'est ainsi qu'on se reconnaît. */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
}

/** Cookie où le choix explicite de l'utilisateur est conservé. */
export const LOCALE_COOKIE = 'thefavbook.langue'

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value)
}
