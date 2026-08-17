'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

import type { Locale } from '@/lib/i18n/config'
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries'

interface TranslationsValue {
  t: Dictionary
  locale: Locale
}

const TranslationsContext = createContext<TranslationsValue | null>(null)

/**
 * Met les textes à disposition des composants client.
 *
 * POURQUOI ne transmettre que la langue, et pas le dictionnaire : certaines
 * entrées sont des fonctions — pluriels, valeurs interpolées — et une fonction
 * ne franchit pas la frontière serveur vers client. Elle n'est pas
 * sérialisable, et le rendu échoue à l'exécution sans que la compilation n'y
 * voie rien.
 *
 * Les quatre dictionnaires partent donc dans le paquet client. Quelques
 * kilo-octets, contre une couche de sérialisation à écrire et à maintenir.
 */
export function TranslationsProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const value = useMemo(() => ({ t: getDictionary(locale), locale }), [locale])

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  )
}

export function useTranslations(): TranslationsValue {
  const value = useContext(TranslationsContext)

  if (value === null) {
    throw new Error('useTranslations exige un TranslationsProvider au-dessus.')
  }

  return value
}
