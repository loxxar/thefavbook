'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  checkNextLinksAction,
  deleteBrokenLinksAction,
  resetLinkChecksAction,
} from '@/lib/bookmarks/link-check-actions'
import {
  DELAY_BETWEEN_CHECK_BATCHES_MS,
  type CheckedSample,
} from '@/lib/bookmarks/link-check-state'

interface LinkCheckPanelProps {
  spaceId: string
  uncheckedCount: number
  brokenCount: number
  totalCount: number
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Campagne de vérification des liens.
 *
 * Le serveur traite un lot par appel, le client rappelle jusqu'à épuisement :
 * quelques milliers de requêtes sortantes dépasseraient sinon le temps
 * d'exécution d'une fonction.
 */
export function LinkCheckPanel({
  spaceId,
  uncheckedCount,
  brokenCount,
  totalCount,
}: LinkCheckPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [broken, setBroken] = useState(brokenCount)
  const [log, setLog] = useState<CheckedSample[]>([])

  const done = remaining === null ? 0 : uncheckedCount - remaining
  const percent =
    uncheckedCount === 0 ? 100 : Math.round((done / uncheckedCount) * 100)

  async function run() {
    setIsRunning(true)
    setLog([])

    for (;;) {
      const result = await checkNextLinksAction(spaceId)

      if (result.status === 'error') {
        toast.error(result.message)
        break
      }

      setRemaining(result.remaining)
      setBroken(result.broken)

      if (result.samples.length > 0) {
        setLog((previous) => [...result.samples, ...previous].slice(0, 40))
      }

      if (result.status === 'done') {
        toast.success('Vérification terminée.')
        break
      }

      await wait(DELAY_BETWEEN_CHECK_BATCHES_MS)
    }

    setIsRunning(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 text-[12px]">
      <dl className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-[11px]">
        <Stat label="Favoris" value={String(totalCount)} />
        <Stat
          label="Non vérifiés"
          value={String(remaining ?? uncheckedCount)}
        />
        <Stat label="Liens morts" value={String(broken)} />
      </dl>

      {isRunning && (
        <div className="shrink-0 space-y-1">
          <div
            className="aqua-progress"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Vérification en cours"
          >
            <div
              className="h-full bg-[linear-gradient(to_bottom,#8fc0ff,#4a8ae8_50%,#2f6fd8)] transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {done} sur {uncheckedCount} vérifiés.
          </p>
        </div>
      )}

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          size="sm"
          disabled={
            isRunning || isPending || (remaining ?? uncheckedCount) === 0
          }
          onClick={run}
        >
          {isRunning ? 'Vérification…' : 'Vérifier les liens'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={isRunning || isPending}
          onClick={() =>
            startTransition(async () => {
              const count = await resetLinkChecksAction(spaceId)
              setRemaining(null)
              toast.success(`${count} liens à revérifier.`)
            })
          }
        >
          Tout revérifier
        </Button>

        <Button
          size="sm"
          variant="destructive"
          disabled={isRunning || isPending || broken === 0}
          onClick={() =>
            startTransition(async () => {
              const confirmed = confirm(
                `Supprimer les ${broken} favoris dont le lien est mort ? Cette action est irréversible.`,
              )

              if (!confirmed) return

              const count = await deleteBrokenLinksAction(spaceId)
              setBroken(0)
              toast.success(`${count} favoris supprimés.`)
            })
          }
        >
          Supprimer les liens morts
        </Button>
      </div>

      <p className="shrink-0 text-[11px] text-muted-foreground">
        Les adresses hors de portée — <code>chrome://</code>, réseau local — ne
        comptent pas comme mortes et ne sont jamais supprimées : le serveur ne
        peut pas les joindre, ce qui ne dit rien de leur validité.
      </p>

      {log.length > 0 && (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto rounded-[6px] border border-[#d2d9e6] p-2 text-[11px]">
          {log.map((entry, index) => (
            <li key={`${entry.title}-${index}`} className="flex gap-2 truncate">
              <span className="w-8 shrink-0 text-destructive tabular-nums">
                {entry.status === 0 ? '—' : entry.status}
              </span>
              <span className="truncate">{entry.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="text-muted-foreground">{label} :</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
