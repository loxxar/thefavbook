'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import {
  acceptAllSuggestionsAction,
  acceptSuggestionAction,
  rejectSuggestionAction,
} from '@/lib/ai/actions'
import { Button } from '@/components/ui/button'

export interface SuggestionRow {
  id: string
  folderPath: string
  reason: string | null
  newTitle: string | null
  bookmarkTitle: string
  bookmarkUrl: string
}

interface SuggestionListProps {
  suggestions: SuggestionRow[]
  totalPending: number
}

export function SuggestionList({
  suggestions,
  totalPending,
}: SuggestionListProps) {
  const [isPending, startTransition] = useTransition()

  function decide(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action()
    })
  }

  if (totalPending === 0) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-[12px]">
          {totalPending} proposition{totalPending > 1 ? 's' : ''} en attente
        </p>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() =>
            decide(async () => {
              const count = await acceptAllSuggestionsAction()
              toast.success(`${count} favoris rangés.`)
            })
          }
        >
          Tout accepter
        </Button>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto rounded-[6px] border border-[#d2d9e6] p-2">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className="flex items-start gap-3 rounded-[4px] px-2 py-1.5 hover:bg-[#e6ebf4]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px]">
                {s.newTitle ?? s.bookmarkTitle}
                {s.newTitle !== null && (
                  <span className="ml-1.5 text-[11px] text-muted-foreground line-through">
                    {s.bookmarkTitle}
                  </span>
                )}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                → <strong>{s.folderPath}</strong>
                {s.reason !== null && ` · ${s.reason}`}
              </p>
            </div>

            <div className="flex shrink-0 gap-1.5">
              <Button
                type="button"
                size="xs"
                disabled={isPending}
                onClick={() => decide(() => acceptSuggestionAction(s.id))}
              >
                Ranger
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={isPending}
                onClick={() => decide(() => rejectSuggestionAction(s.id))}
              >
                Ignorer
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
