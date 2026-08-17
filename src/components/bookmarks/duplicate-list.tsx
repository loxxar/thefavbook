'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useTranslations } from '@/components/i18n/translations-provider'
import { Button } from '@/components/ui/button'
import {
  mergeAllDuplicatesAction,
  mergeDuplicatesAction,
} from '@/lib/bookmarks/duplicate-actions'
import type { DuplicateGroup } from '@/lib/bookmarks/duplicates'

interface DuplicateListProps {
  groups: DuplicateGroup[]
  totalGroups: number
  spaceId: string
}

/**
 * Triage des doublons.
 *
 * Chaque groupe propose de conserver le plus ancien — celui qui porte la date
 * d'ajout d'origine — mais l'utilisateur peut désigner un autre. Rien n'est
 * supprimé sans qu'il ait tranché : une normalisation d'URL trop zélée
 * effacerait des pages réellement distinctes.
 */
export function DuplicateList({
  groups,
  totalGroups,
  spaceId,
}: DuplicateListProps) {
  const { t } = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [chosen, setChosen] = useState<Record<string, string>>({})

  if (totalGroups === 0) {
    return (
      <p className="text-[12px] text-muted-foreground">
        {t.maintenance.noDuplicates}
      </p>
    )
  }

  const removable = groups.reduce((n, g) => n + g.entries.length - 1, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-[12px]">
          {t.maintenance.duplicateSummary(
            totalGroups,
            groups.length,
            removable,
          )}
        </p>

        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const confirmed = confirm(
                t.maintenance.confirmMergeAll(totalGroups),
              )

              if (!confirmed) return

              const result = await mergeAllDuplicatesAction(spaceId)

              if (result.ok) {
                toast.success(t.maintenance.removed(result.removed))
              } else {
                toast.error(result.message)
              }
            })
          }
        >
          {t.maintenance.mergeAll}
        </Button>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-[6px] border border-[#d2d9e6] p-2">
        {groups.map((group) => {
          const keepId = chosen[group.canonicalUrl] ?? group.entries[0]?.id

          return (
            <li
              key={group.canonicalUrl}
              className="rounded-[4px] border border-[#e6ebf4] p-2"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.maintenance.copies(group.entries.length)} ·{' '}
                  {group.canonicalUrl}
                </p>
                <Button
                  size="xs"
                  disabled={isPending || keepId === undefined}
                  onClick={() =>
                    startTransition(async () => {
                      if (keepId === undefined) return

                      const result = await mergeDuplicatesAction(
                        group.canonicalUrl,
                        keepId,
                        spaceId,
                      )

                      if (result.ok) {
                        toast.success(t.maintenance.removed(result.removed))
                      } else {
                        toast.error(result.message)
                      }
                    })
                  }
                >
                  {t.maintenance.merge}
                </Button>
              </div>

              <ul className="space-y-0.5">
                {group.entries.map((entry) => (
                  <li key={entry.id}>
                    <label className="flex cursor-default items-center gap-2 rounded-[3px] px-1 py-0.5 text-[12px] hover:bg-[#e6ebf4]">
                      <input
                        type="radio"
                        name={group.canonicalUrl}
                        checked={keepId === entry.id}
                        onChange={() =>
                          setChosen((previous) => ({
                            ...previous,
                            [group.canonicalUrl]: entry.id,
                          }))
                        }
                      />
                      <span className="truncate">
                        {entry.title === '' ? entry.url : entry.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {entry.folderPath}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
