'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { isLocale, LOCALE_COOKIE } from '@/lib/i18n/config'

/** Enregistre le choix de langue pour un an. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return

  const store = await cookies()

  store.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  revalidatePath('/', 'layout')
}
