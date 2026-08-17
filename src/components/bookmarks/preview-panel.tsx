'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from '@/components/i18n/translations-provider'
import { Button } from '@/components/ui/button'
import type { ParsedBookmark } from '@/lib/bookmarks/types'
import type { PagePreview } from '@/lib/preview/opengraph'

interface PreviewPanelProps {
  bookmark: ParsedBookmark | null
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; preview: PagePreview }
  | { phase: 'failed'; message: string }

/**
 * Panneau de consultation.
 *
 * L'aperçu s'appuie sur les métadonnées de partage de la page — celles que les
 * sites publient exprès. Une capture d'écran donnerait une image plus fidèle,
 * mais exigerait un navigateur sans interface : trois à cinq secondes et
 * plusieurs centaines de kilo-octets par favori, pour un résultat vide sur
 * toutes les pages derrière une connexion.
 *
 * Le cadre intégré reste proposé en second recours : la plupart des sites le
 * refusent, `X-Frame-Options` et `frame-ancestors` existant pour empêcher le
 * détournement de clic.
 */
export function PreviewPanel({ bookmark }: PreviewPanelProps) {
  const { t, locale } = useTranslations()
  // L'état démarre en chargement et se réinitialise par remontage : le
  // composant appelant pose un `key` sur l'adresse. Corriger l'état depuis
  // l'effet reviendrait à rendre une fois pour rien.
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [showFrame, setShowFrame] = useState(false)

  const url = bookmark?.url ?? null
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  // Extrait avant l'effet : le dictionnaire entier comme dépendance
  // relancerait la requête à chaque rendu.
  const unavailable = t.preview.noMetadata

  useEffect(() => {
    if (url === null) return

    const controller = new AbortController()

    async function load(target: string) {
      try {
        const response = await fetch(
          `/api/preview?url=${encodeURIComponent(target)}`,
          { signal: controller.signal },
        )
        const payload: unknown = await response.json()

        if (!response.ok) {
          const message =
            typeof (payload as { erreur?: unknown }).erreur === 'string'
              ? (payload as { erreur: string }).erreur
              : unavailable
          setState({ phase: 'failed', message })
          return
        }

        setState({ phase: 'ready', preview: payload as PagePreview })
      } catch {
        if (!controller.signal.aborted) {
          setState({ phase: 'failed', message: unavailable })
        }
      }
    }

    void load(url)

    // Changer de favori pendant le chargement annule la requête en cours.
    return () => controller.abort()
  }, [url, unavailable])

  if (bookmark === null) {
    return (
      <div className="flex h-full items-center justify-center rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-6 text-center text-[12px] text-muted-foreground">
        {t.preview.empty}
      </div>
    )
  }

  const hostname = safeHostname(bookmark.url)
  const preview = state.phase === 'ready' ? state.preview : null

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 space-y-1.5">
        <h2 className="text-[13px] leading-snug font-semibold">
          {bookmark.title === '' ? hostname : bookmark.title}
        </h2>
        <p className="text-[11px] break-all text-muted-foreground">
          {bookmark.url}
        </p>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {hostname !== null && (
            <div className="flex gap-1">
              <dt>{t.preview.domain}</dt>
              <dd className="text-foreground">{hostname}</dd>
            </div>
          )}
          {bookmark.addDate !== null && (
            <div className="flex gap-1">
              <dt>{t.preview.addedOn}</dt>
              <dd className="text-foreground">
                {dateFormat.format(bookmark.addDate)}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" asChild>
            <a href={bookmark.url} target="_blank" rel="noreferrer noopener">
              {t.preview.openInTab}
            </a>
          </Button>
          {!showFrame && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFrame(true)}
            >
              {t.preview.tryEmbed}
            </Button>
          )}
        </div>
      </div>

      {showFrame ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <iframe
            src={bookmark.url}
            title={`Aperçu de ${bookmark.title}`}
            className="min-h-0 flex-1 rounded-[6px] border border-[#b3bac6] bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
          <p className="shrink-0 text-[11px] text-muted-foreground">
            {t.preview.embedRefused}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-[6px] border border-[#b3bac6] bg-white">
          {state.phase === 'loading' && (
            <div className="space-y-2 p-4">
              <div className="aqua-progress">
                <div className="aqua-progress-bar" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t.preview.loading}
              </p>
            </div>
          )}

          {state.phase === 'failed' && (
            <p className="p-4 text-[11px] text-muted-foreground">
              {state.message} {t.preview.failedSuffix}
            </p>
          )}

          {preview !== null && (
            <div className="space-y-2">
              {preview.imageUrl !== null && (
                // Image distante et arbitraire : `next/image` imposerait de
                // déclarer chaque domaine, ce qui est impossible ici.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.imageUrl}
                  alt=""
                  className="max-h-[240px] w-full border-b border-[#d2d9e6] object-cover"
                  loading="lazy"
                />
              )}
              <div className="space-y-1 p-3">
                {preview.siteName !== null && (
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    {preview.siteName}
                  </p>
                )}
                {preview.title !== null && (
                  <p className="text-[12px] font-semibold">{preview.title}</p>
                )}
                {preview.description !== null && (
                  <p className="text-[11px] text-muted-foreground">
                    {preview.description}
                  </p>
                )}
                {preview.title === null &&
                  preview.description === null &&
                  preview.imageUrl === null && (
                    <p className="text-[11px] text-muted-foreground">
                      {t.preview.noMetadata}
                    </p>
                  )}
              </div>
            </div>
          )}
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
