import type { Metadata } from 'next'

import { TranslationsProvider } from '@/components/i18n/translations-provider'
import { Toaster } from '@/components/ui/sonner'
import { getLocale } from '@/lib/i18n/server'

import './globals.css'

export const metadata: Metadata = {
  title: 'thefavbook',
  description: 'Import, sort and export your browser bookmarks without losses.',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className="h-full">
      <body className="flex min-h-full flex-col">
        {/* Seule la langue traverse : les entrées de dictionnaire qui sont des
            fonctions ne sont pas sérialisables, et le rendu échouerait à
            l'exécution. Le dictionnaire est résolu des deux côtés à partir de
            cette même valeur, donc sans clignotement. */}
        <TranslationsProvider locale={locale}>{children}</TranslationsProvider>
        <Toaster />
      </body>
    </html>
  )
}
