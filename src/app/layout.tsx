import type { Metadata } from 'next'

import { Toaster } from '@/components/ui/sonner'

import './globals.css'

export const metadata: Metadata = {
  title: 'thefavbook',
  description: 'Importer, fusionner et exporter ses favoris sans rien perdre.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className="h-full">
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
