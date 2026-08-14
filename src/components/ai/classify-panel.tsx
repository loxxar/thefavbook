'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { classifyNextBatchAction } from '@/lib/ai/actions'
import {
  DELAY_BETWEEN_BATCHES_MS,
  QUOTA_COOLDOWN_MS,
} from '@/lib/ai/state'
import { setAiConsentAction } from '@/lib/auth/account-actions'
import { Button } from '@/components/ui/button'

interface ClassifyPanelProps {
  hasConsent: boolean
  unclassifiedCount: number
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ClassifyPanel({
  hasConsent,
  unclassifiedCount,
}: ClassifyPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const stopRef = useRef(false)

  const total = unclassifiedCount
  const done = remaining === null ? 0 : total - remaining
  const percent = total === 0 ? 100 : Math.round((done / total) * 100)

  // L'ordre de grandeur mérite d'être annoncé avant de lancer, pas découvert
  // en attendant.
  const estimatedMinutes = Math.ceil(
    (Math.ceil(total / 100) * DELAY_BETWEEN_BATCHES_MS) / 60_000,
  )

  function grantConsent() {
    startTransition(async () => {
      await setAiConsentAction(true)
    })
  }

  /**
   * Le serveur ne traite qu'un lot par appel : on le rappelle jusqu'à
   * épuisement. C'est ce qui donne une progression réelle, chiffrée.
   *
   * La cadence est imposée par le palier gratuit — quinze requêtes par minute
   * sur Flash-Lite. Sans pause, une collection de 4000 favoris se ferait
   * rejeter dès le seizième lot.
   */
  async function runClassification() {
    setIsRunning(true)
    stopRef.current = false
    let quotaRetried = false

    for (;;) {
      if (stopRef.current) break

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

      if (result.status === 'quota') {
        if (quotaRetried) {
          toast.error(
            `${result.message} Les favoris déjà analysés sont conservés : relancez plus tard.`,
          )
          break
        }

        quotaRetried = true
        setNotice('Quota atteint, reprise dans une minute…')
        await wait(QUOTA_COOLDOWN_MS)
        setNotice(null)
        continue
      }

      quotaRetried = false
      await wait(DELAY_BETWEEN_BATCHES_MS)
    }

    setNotice(null)
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

      {isRunning ? (
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
            {notice ?? `${done} sur ${total} analysés.`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              stopRef.current = true
              setNotice('Arrêt après le lot en cours…')
            }}
          >
            Arrêter
          </Button>
        </div>
      ) : (
        <>
          <Button type="button" onClick={runClassification}>
            Proposer un rangement
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Environ {estimatedMinutes} minute
            {estimatedMinutes > 1 ? 's' : ''} : le service gratuit limite à quinze
            requêtes par minute, l&apos;analyse avance par lots de cent. Vous
            pouvez l&apos;interrompre, ce qui est déjà analysé est conservé.
          </p>
        </>
      )}
    </div>
  )
}
