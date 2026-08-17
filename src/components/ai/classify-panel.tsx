'use client'

import { useRouter } from 'next/navigation'
import { useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  classifyNextBatchAction,
  clearPendingSuggestionsAction,
} from '@/lib/ai/actions'
import { ClassifyMonitor } from '@/components/ai/classify-monitor'
import {
  DELAY_BETWEEN_BATCHES_MS,
  LOG_LENGTH,
  QUOTA_COOLDOWN_MS,
  type ClassifiedSample,
} from '@/lib/ai/state'
import { CLASSIFY_BATCH_SIZE } from '@/lib/ai/classify'
import { CLASSIFICATION_STYLES, DEFAULT_STYLE_ID } from '@/lib/ai/styles'
import { setAiConsentAction } from '@/lib/auth/account-actions'
import { Button } from '@/components/ui/button'

interface ClassifyPanelProps {
  hasConsent: boolean
  unclassifiedCount: number
  /** Propositions déjà produites, en attente d'arbitrage. */
  pendingCount: number
  spaceId: string
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ClassifyPanel({
  hasConsent,
  unclassifiedCount,
  pendingCount,
  spaceId,
}: ClassifyPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID)
  const [log, setLog] = useState<ClassifiedSample[]>([])
  const [folderCounts, setFolderCounts] = useState<Map<string, number>>(
    new Map(),
  )
  const [batchNumber, setBatchNumber] = useState(0)
  /**
   * Nombre de favoris à traiter, arrêté au lancement.
   *
   * POURQUOI ne pas lire la propriété en direct : elle descend du serveur et
   * diminue à mesure que les suggestions naissent. Le dénominateur suivait
   * alors le numérateur et la barre n'avançait jamais.
   */
  const [runTotal, setRunTotal] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const stopRef = useRef(false)
  // Un groupe de radios porte sur tout le document : sans nom propre, deux
  // panneaux affichés ensemble se voleraient la sélection.
  const groupName = useId()

  const total = runTotal ?? unclassifiedCount
  const done = remaining === null ? 0 : Math.max(0, total - remaining)
  const batchTotal = Math.max(1, Math.ceil(total / CLASSIFY_BATCH_SIZE))

  // Estimation fondée sur le rythme constaté, pas sur une constante : le temps
  // de réponse du modèle varie plus que la cadence qu'on impose.
  const remainingSeconds =
    done === 0 ? 0 : (elapsedSeconds / done) * (total - done)

  const folderTally = [...folderCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)

  // L'ordre de grandeur mérite d'être annoncé avant de lancer, pas découvert
  // en attendant.
  const estimatedMinutes = Math.ceil(
    (Math.ceil(unclassifiedCount / CLASSIFY_BATCH_SIZE) *
      DELAY_BETWEEN_BATCHES_MS) /
      60_000,
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
    setRunTotal(unclassifiedCount)
    setRemaining(unclassifiedCount)
    setIsRunning(true)
    stopRef.current = false
    setLog([])
    setFolderCounts(new Map())
    setBatchNumber(0)
    setElapsedSeconds(0)

    const startedAt = Date.now()
    const ticker = setInterval(
      () => setElapsedSeconds((Date.now() - startedAt) / 1000),
      1000,
    )
    let quotaRetried = false

    for (;;) {
      if (stopRef.current) break

      const result = await classifyNextBatchAction(styleId, spaceId)

      if (result.status === 'error') {
        toast.error(result.message)
        break
      }

      setRemaining(result.remaining)

      if (result.samples.length > 0) {
        setBatchNumber((n) => n + 1)
        // Le plus récent en tête : c'est ce qu'on regarde.
        setLog((previous) =>
          [...result.samples.slice().reverse(), ...previous].slice(
            0,
            LOG_LENGTH,
          ),
        )
        setFolderCounts((previous) => {
          const next = new Map(previous)
          for (const sample of result.samples) {
            next.set(sample.folderPath, (next.get(sample.folderPath) ?? 0) + 1)
          }
          return next
        })
      }

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

    clearInterval(ticker)
    setNotice(null)
    setIsRunning(false)
    router.refresh()
  }

  if (!hasConsent) {
    return (
      <div className="space-y-3 text-[12px]">
        <p>
          Pour proposer un rangement, l&apos;outil envoie{' '}
          <strong>le titre et l&apos;adresse</strong> de vos favoris à
          OpenRouter, qui les confie au modèle Gemini Flash-Lite de Google.
          Jamais le contenu des pages, jamais votre adresse e-mail. Les
          fournisseurs qui s&apos;entraînent sur les requêtes sont exclus.
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

  // Tout est analysé : il reste à pouvoir tout reprendre sous un autre
  // critère, sinon l'écran devient un cul-de-sac.
  if (total === 0) {
    return (
      <div className="space-y-2 text-[12px]">
        <p className="text-muted-foreground">
          Tous vos favoris ont été analysés.
        </p>
        {pendingCount > 0 && (
          <p className="text-muted-foreground">
            Pour rejouer l&apos;analyse sous un autre critère, effacez
            d&apos;abord les {pendingCount} propositions en attente.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || pendingCount === 0}
          onClick={() =>
            startTransition(async () => {
              const count = await clearPendingSuggestionsAction()
              toast.success(`${count} propositions effacées.`)
            })
          }
        >
          Effacer et recommencer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-[12px]">
      <p>
        {total} favori{total > 1 ? 's' : ''} en attente d&apos;analyse. Les
        propositions s&apos;affichent ensuite pour validation — rien n&apos;est
        déplacé sans votre accord.
      </p>

      <fieldset className="space-y-1.5" disabled={isRunning}>
        <legend className="mb-1 font-semibold">Critère de rangement</legend>
        {CLASSIFICATION_STYLES.map((style) => (
          <label
            key={style.id}
            className="flex cursor-default items-start gap-2 rounded-[4px] px-1 py-0.5 hover:bg-[#e6ebf4]"
          >
            <input
              type="radio"
              name={groupName}
              value={style.id}
              checked={styleId === style.id}
              onChange={() => setStyleId(style.id)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold">{style.label}</span>
              <span className="block text-[11px] text-muted-foreground">
                {style.summary}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {pendingCount > 0 && !isRunning && (
        <p className="rounded-[4px] border border-[#d2d9e6] bg-[#f7f9fc] p-2 text-[11px] text-muted-foreground">
          {pendingCount} proposition{pendingCount > 1 ? 's' : ''} attendent déjà
          votre arbitrage. Changer de critère n&apos;a d&apos;effet que sur les
          favoris non encore analysés — pour repartir d&apos;une page blanche,
          effacez-les d&apos;abord.{' '}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() =>
              startTransition(async () => {
                const count = await clearPendingSuggestionsAction()
                toast.success(`${count} propositions effacées.`)
              })
            }
          >
            Effacer les propositions en attente
          </button>
        </p>
      )}

      {isRunning ? (
        <div className="space-y-2">
          <ClassifyMonitor
            done={done}
            total={total}
            batchNumber={batchNumber}
            batchTotal={batchTotal}
            elapsedSeconds={elapsedSeconds}
            remainingSeconds={remainingSeconds}
            notice={notice}
            log={log}
            folderTally={folderTally}
          />
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
            {estimatedMinutes > 1 ? 's' : ''} : l&apos;analyse avance par lots
            de cent, espacés pour ménager le fournisseur. Vous pouvez
            l&apos;interrompre, ce qui est déjà analysé est conservé.
          </p>
        </>
      )}
    </div>
  )
}
