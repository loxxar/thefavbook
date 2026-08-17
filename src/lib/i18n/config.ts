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

/**
 * Déduit la langue de l'en-tête envoyé par le navigateur.
 *
 * On ne lit que la partie principale — `de-AT` devient `de` : distinguer les
 * variantes régionales n'apporterait rien tant qu'on n'a qu'une traduction par
 * langue.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (acceptLanguage === null) return DEFAULT_LOCALE

  const wanted = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: tag.split('-')[0]?.toLowerCase() ?? '', q: Number(q ?? 1) }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of wanted) {
    if (isLocale(tag)) return tag
  }

  return DEFAULT_LOCALE
}
