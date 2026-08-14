'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface ExportButtonProps {
  bookmarkCount: number
  folderCount: number
}

/** Adresse du pot à pourboires. Absente en développement : rien ne s'affiche. */
const TIP_URL = process.env.NEXT_PUBLIC_TIP_URL ?? ''

/** Une seule demande par navigateur. Au-delà, c'est du harcèlement. */
const ASKED_KEY = 'thefavbook.tip-asked'

/**
 * Export, puis demande de soutien.
 *
 * POURQUOI le téléchargement part avant la fenêtre : intercaler une demande
 * entre le clic et le fichier transforme le don en péage. L'export est dû,
 * le café ne l'est pas.
 */
export function ExportButton({
  bookmarkCount,
  folderCount,
}: ExportButtonProps) {
  const [isAsking, setIsAsking] = useState(false)

  function onExport() {
    if (TIP_URL === '') return
    if (localStorage.getItem(ASKED_KEY) !== null) return

    localStorage.setItem(ASKED_KEY, new Date().toISOString())
    // Laisse le téléchargement s'amorcer avant de couvrir l'écran.
    setTimeout(() => setIsAsking(true), 1200)
  }

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <a href="/api/export" download onClick={onExport}>
          Exporter en HTML
        </a>
      </Button>

      {isAsking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="aqua-window w-full max-w-[380px]">
            <header className="aqua-titlebar flex h-[26px] shrink-0 items-center px-2">
              <span className="flex-1 text-center text-[13px] font-semibold text-[#454545] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
                Merci
              </span>
            </header>

            <div className="space-y-3 bg-white p-5 text-[12px]">
              <p>
                Votre fichier est en cours de téléchargement :{' '}
                <strong>
                  {bookmarkCount} favori{bookmarkCount > 1 ? 's' : ''} rangé
                  {bookmarkCount > 1 ? 's' : ''} en {folderCount} dossier
                  {folderCount > 1 ? 's' : ''}
                </strong>
                . Il s&apos;ouvre dans n&apos;importe quel navigateur.
              </p>

              <p className="text-muted-foreground">
                thefavbook est gratuit et le restera. Si le rangement vous a
                fait gagner une soirée, vous pouvez m&apos;offrir un café.
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAsking(false)}
                >
                  Une autre fois
                </Button>
                <Button size="sm" asChild>
                  <a href={TIP_URL} target="_blank" rel="noreferrer noopener">
                    Offrir un café
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
