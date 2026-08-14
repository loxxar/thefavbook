'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { ParsedBookmark } from '@/lib/bookmarks/types'

interface PreviewPanelProps {
  bookmark: ParsedBookmark | null
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })

/**
 * Panneau de consultation.
 *
 * POURQUOI l'aperçu intégré n'est pas affiché d'emblée : la majorité des sites
 * refusent d'être chargés dans un cadre — `X-Frame-Options` et
 * `frame-ancestors` existent pour empêcher le détournement de clic. Google
 * Docs, Drive, Cloudflare ou cPanel renverraient un rectangle blanc.
 *
 * On montre donc d'abord ce dont on est certain : les informations du favori,
 * qui viennent de la base et s'affichent toujours. L'aperçu est proposé
 * ensuite, en annonçant qu'il peut être refusé — plutôt que de laisser croire
 * à une panne.
 */
export function PreviewPanel({ bookmark }: PreviewPanelProps) {
  // L'état est remis à zéro par le `key` posé sur le composant appelant :
  // changer de favori remonte un panneau neuf, plutôt que de corriger après
  // coup dans un effet.
  const [showFrame, setShowFrame] = useState(false)

  if (bookmark === null) {
    return (
      <div className="flex h-full items-center justify-center rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-6 text-center text-[12px] text-muted-foreground">
        Sélectionnez un favori pour l&apos;examiner sans quitter la page.
      </div>
    )
  }

  const hostname = safeHostname(bookmark.url)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 space-y-1.5">
        <h2 className="text-[13px] leading-snug font-semibold">
          {bookmark.title === '' ? hostname : bookmark.title}
        </h2>
        <p className="text-[11px] break-all text-muted-foreground">
          {bookmark.url}
        </p>

        {bookmark.description !== null && bookmark.description !== '' && (
          <p className="text-[12px]">{bookmark.description}</p>
        )}

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {hostname !== null && (
            <div className="flex gap-1">
              <dt>Domaine :</dt>
              <dd className="text-foreground">{hostname}</dd>
            </div>
          )}
          {bookmark.addDate !== null && (
            <div className="flex gap-1">
              <dt>Ajouté le :</dt>
              <dd className="text-foreground">
                {dateFormat.format(bookmark.addDate)}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" asChild>
            <a href={bookmark.url} target="_blank" rel="noreferrer noopener">
              Ouvrir dans un onglet
            </a>
          </Button>
          {!showFrame && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFrame(true)}
            >
              Tenter l&apos;aperçu ici
            </Button>
          )}
        </div>
      </div>

      {showFrame ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <iframe
            key={bookmark.url}
            src={bookmark.url}
            title={`Aperçu de ${bookmark.title}`}
            className="min-h-0 flex-1 rounded-[6px] border border-[#b3bac6] bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
          <p className="shrink-0 text-[11px] text-muted-foreground">
            Un cadre vide signifie que le site refuse d&apos;être affiché
            ailleurs que chez lui. Rien n&apos;y remédie de notre côté : passez
            par « Ouvrir dans un onglet ».
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-4 text-[11px] text-muted-foreground">
          De nombreux sites — Google, les tableaux de bord d&apos;hébergeurs,
          les espaces bancaires — interdisent leur affichage dans une autre
          page. L&apos;aperçu reste donc à la demande.
        </div>
      )}
    </div>
  )
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}
