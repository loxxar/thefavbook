'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { classifyNextBatchAction } from '@/lib/ai/actions'
import { setAiConsentAction } from '@/lib/auth/account-actions'
import { Button } from '@/components/ui/button'

interface ClassifyPanelProps {
  hasConsent: boolean
  unclassifiedCount: number
}

export function ClassifyPanel({
  hasConsent,
  unclassifiedCount,
}: ClassifyPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const total = unclassifiedCount
  const done = remaining === null ? 0 : total - remaining
  const percent = total === 0 ? 100 : Math.round((done / total) * 100)

  function grantConsent() {
    startTransition(async () => {
      await setAiConsentAction(true)
    })
  }

  /**
   * Le serveur ne traite qu'un lot par appel : on le rappelle jusqu'à
   * épuisement. C'est ce qui donne une progression réelle, chiffrée.
   */
  async function runClassification() {
    setIsRunning(true)

    for (;;) {
      const result = await classifyNextBatchAction()

      if (result.status === 'error') {
        toast.error(result.message)
        break
      }

      setRemaining(result.remaining)

      if (result.status === 'done') {
        toast.success('Analyse terminée.')
        break
      }
    }

    setIsRunning(false)
  }

  if (!hasConsent) {
    return (
      <div className="space-y-3 text-[12px]">
        <p>
          Pour proposer un rangement, l&apos;outil envoie{' '}
          <strong>le titre et l&apos;adresse</strong> de vos favoris au service
          Gemini de Google. Jamais le contenu des pages, jamais votre adresse
          e-mail.
        </p>
        <p className="text-muted-foreground">
          Rien ne part tant que vous n&apos;avez pas accepté, et l&apos;outil
          reste entièrement utilisable sans cette fonction.
        </p>
        <Button type="button" onClick={grantConsent} disabled={isPending}>
          {isPending ? 'Enregistrement…' : 'J’accepte, analyser mes favoris'}
        </Button>
      </div>
    )
  }

  if (total === 0) {
    return (
      <p className="text-[12px] text-muted-foreground">
        Tous vos favoris ont été analysés.
      </p>
    )
  }

  return (
    <div className="space-y-3 text-[12px]">
      <p>
        {total} favori{total > 1 ? 's' : ''} en attente d&apos;analyse. Les
        propositions s&apos;affichent ensuite pour validation — rien n&apos;est
        déplacé sans votre accord.
      </p>

      {isRunning && (
        <div className="space-y-1.5">
          <div
            className="aqua-progress"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Analyse en cours"
          >
            <div
              className="h-full bg-[linear-gradient(to_bottom,#8fc0ff,#4a8ae8_50%,#2f6fd8)] transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {done} sur {total} analysés.
          </p>
        </div>
      )}

      <Button type="button" onClick={runClassification} disabled={isRunning}>
        {isRunning ? 'Analyse en cours…' : 'Proposer un rangement'}
      </Button>
    </div>
  )
}
