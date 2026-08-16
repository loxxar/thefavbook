'use client'

import { MacWindow } from '@/components/mac/mac-window'
import { Button } from '@/components/ui/button'

interface TipDialogProps {
  bookmarkCount: number
  folderCount: number
  /** Soutiens déjà reçus. Zéro : on n'affiche rien. */
  supporterCount: number
  onClose: () => void
}

/** Adresse du pot à pourboires. Absente : la fenêtre ne s'affiche pas. */
const TIP_URL = process.env.NEXT_PUBLIC_TIP_URL ?? ''

/** Une seule demande par navigateur. Au-delà, c'est du harcèlement. */
const ASKED_KEY = 'thefavbook.tip-asked'

export function shouldAskForTip(): boolean {
  if (TIP_URL === '') return false
  if (localStorage.getItem(ASKED_KEY) !== null) return false

  localStorage.setItem(ASKED_KEY, new Date().toISOString())
  return true
}

/**
 * Demande de soutien, après le départ du téléchargement.
 *
 * Intercaler la demande entre le clic et le fichier transformerait le don en
 * péage. L'export est dû, le café ne l'est pas.
 */
export function TipDialog({
  bookmarkCount,
  folderCount,
  supporterCount,
  onClose,
}: TipDialogProps) {
  if (TIP_URL === '') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[380px]">
        <MacWindow title="Merci" onClose={onClose}>
          <div className="space-y-3 text-[12px]">
            <p>
              Votre fichier est en cours de téléchargement :{' '}
              <strong>
                {bookmarkCount} favoris rangés en {folderCount} dossiers
              </strong>
              . Il s&apos;ouvre dans n&apos;importe quel navigateur.
            </p>

            <p className="text-muted-foreground">
              thefavbook est gratuit et le restera. Si le rangement vous a fait
              gagner une soirée, vous pouvez m&apos;offrir un café.
            </p>

            {supporterCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {supporterCount} personne{supporterCount > 1 ? 's' : ''}{' '}
                l&apos;ont déjà fait.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Une autre fois
              </Button>
              <Button size="sm" asChild>
                <a href={TIP_URL} target="_blank" rel="noreferrer noopener">
                  Offrir un café
                </a>
              </Button>
            </div>
          </div>
        </MacWindow>
      </div>
    </div>
  )
}
