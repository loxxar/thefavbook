'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { AquaButton, StatusSphere } from '@/components/aqua/aqua-controls'
import { useTranslations } from '@/components/i18n/translations-provider'
import {
  acceptSuggestionAction,
  rejectSuggestionAction,
} from '@/lib/ai/actions'
import { deleteBookmarkAction } from '@/lib/bookmarks/cleanup-actions'
import type { BookmarkRow, RowHealth } from '@/lib/bookmarks/rows'
import type { Locale } from '@/lib/i18n/config'

interface InspectorProps {
  row: BookmarkRow | null
  locale: Locale
  onDeleted: (id: string) => void
}

/**
 * Panneau de détail.
 *
 * Il ne duplique pas la liste : il porte ce qui n'y tient pas — l'adresse
 * entière, la réponse du serveur en clair, et les deux décisions qu'on peut
 * prendre sur un favori : appliquer le rangement proposé, ou le retirer.
 */
export function Inspector({ row, locale, onDeleted }: InspectorProps) {
  const { t } = useTranslations()
  const [isPending, startTransition] = useTransition()

  if (row === null) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-[11px] text-muted-foreground">
        {t.workspace.noSelection}
      </div>
    )
  }

  const healthLabel: Record<RowHealth, string> = {
    ok: t.workspace.statusOk,
    dead: t.workspace.statusDead,
    unknown: t.workspace.statusUnknown,
    idle: t.workspace.statusIdle,
  }

  const added =
    row.addedAt === null
      ? '—'
      : new Intl.DateTimeFormat(locale, {
          dateStyle: 'long',
        }).format(row.addedAt)

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 text-[11px]">
      <div>
        <h2 className="text-[12px] leading-snug font-bold break-words">
          {row.title}
        </h2>
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all text-[#1c5fd6] underline underline-offset-2"
        >
          {row.url}
        </a>
      </div>

      <dl className="space-y-1 border-t border-[#d2d9e6] pt-2">
        <Field label={t.workspace.folderLabel}>
          {row.folderPath === '' ? t.workspace.unfiled : row.folderPath}
        </Field>

        <Field label={t.workspace.statusLabel}>
          <span className="flex items-center gap-[6px]">
            <StatusSphere health={row.health} label={healthLabel[row.health]} />
            <span>
              {healthLabel[row.health]}
              {row.status !== null && row.status > 0 && ` · ${row.status}`}
            </span>
          </span>
        </Field>

        <Field label={t.workspace.addedLabel}>{added}</Field>
      </dl>

      {/* Rangement proposé par l'analyse, quand il y en a un en attente. */}
      <div className="border-t border-[#d2d9e6] pt-2">
        <h3 className="mb-1 text-[10px] font-bold tracking-wide text-[#63708a] uppercase">
          {t.workspace.aiProposal}
        </h3>

        {row.suggestion === null ? (
          <p className="text-muted-foreground">{t.workspace.noProposal}</p>
        ) : (
          <div className="space-y-2">
            <p className="rounded-[4px] border border-[#c8d4e8] bg-[#eef4fd] px-2 py-1 font-medium">
              {row.suggestion.folderPath}
            </p>

            {row.suggestion.reason !== null && row.suggestion.reason !== '' && (
              <p className="text-muted-foreground italic">
                {row.suggestion.reason}
              </p>
            )}

            <div className="flex gap-2">
              <AquaButton
                tone="primary"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    if (row.suggestion === null) return
                    await acceptSuggestionAction(row.suggestion.id)
                  })
                }
              >
                {t.workspace.accept}
              </AquaButton>

              <AquaButton
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    if (row.suggestion === null) return
                    await rejectSuggestionAction(row.suggestion.id)
                  })
                }
              >
                {t.workspace.ignore}
              </AquaButton>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2 border-t border-[#d2d9e6] pt-2">
        <AquaButton
          onClick={() => window.open(row.url, '_blank', 'noopener,noreferrer')}
        >
          {t.workspace.openLink}
        </AquaButton>

        <AquaButton
          tone="danger"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteBookmarkAction(row.id)
              onDeleted(row.id)
              toast.success(t.workspace.cleanDone(1))
            })
          }
        >
          {t.workspace.deleteBookmark}
        </AquaButton>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-[74px] shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  )
}
