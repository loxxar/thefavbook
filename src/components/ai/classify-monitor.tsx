'use client'

import type { ClassifiedSample } from '@/lib/ai/state'

interface ClassifyMonitorProps {
  done: number
  total: number
  batchNumber: number
  batchTotal: number
  elapsedSeconds: number
  remainingSeconds: number
  notice: string | null
  log: ClassifiedSample[]
  folderTally: [string, number][]
}

/**
 * Vue de déroulement de l'analyse.
 *
 * POURQUOI montrer les décisions et pas seulement un pourcentage : sur quatre
 * minutes, un chiffre qui monte n'apprend rien. Voir défiler les rangements et
 * les dossiers qui émergent permet de juger tout de suite si le critère choisi
 * donne ce qu'on attendait — et d'arrêter sans attendre la fin s'il part de
 * travers.
 */
export function ClassifyMonitor({
  done,
  total,
  batchNumber,
  batchTotal,
  elapsedSeconds,
  remainingSeconds,
  notice,
  log,
  folderTally,
}: ClassifyMonitorProps) {
  const percent = total === 0 ? 100 : Math.round((done / total) * 100)

  return (
    <div className="space-y-2">
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

      <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] sm:grid-cols-4">
        <Stat label="Analysés" value={`${done} / ${total}`} />
        <Stat label="Lot" value={`${batchNumber} / ${batchTotal}`} />
        <Stat label="Écoulé" value={formatDuration(elapsedSeconds)} />
        <Stat
          label="Restant"
          value={done === 0 ? '—' : formatDuration(remainingSeconds)}
        />
      </dl>

      {notice !== null && (
        <p className="text-[11px] text-muted-foreground">{notice}</p>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-[168px] overflow-y-auto rounded-[4px] border border-[#d2d9e6] bg-white p-1.5">
          {log.length === 0 ? (
            <p className="p-1 text-[11px] text-muted-foreground">
              Envoi du premier lot…
            </p>
          ) : (
            <ul className="space-y-0.5 text-[11px]">
              {log.map((entry, index) => (
                <li
                  key={`${entry.title}-${index}`}
                  className="flex gap-1.5 truncate"
                >
                  <span className="truncate">{entry.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    → {entry.folderPath}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-[168px] overflow-y-auto rounded-[4px] border border-[#d2d9e6] bg-white p-1.5">
          <p className="px-1 pb-1 text-[11px] font-semibold">
            Dossiers proposés
          </p>
          {folderTally.length === 0 ? (
            <p className="px-1 text-[11px] text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-0.5 text-[11px]">
              {folderTally.map(([folder, count]) => (
                <li key={folder} className="flex justify-between gap-2">
                  <span className="truncate">{folder}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`

  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)

  return `${minutes} min ${String(rest).padStart(2, '0')} s`
}
