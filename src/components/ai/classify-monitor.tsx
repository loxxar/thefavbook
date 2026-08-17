'use client'

import { AquaTube } from '@/components/aqua/aqua-controls'
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
      {/*
        Le pourcentage est donné en grand, à côté de la jauge plutôt qu'en
        dessous : c'est la seule chose qu'on regarde en repassant devant
        l'écran, et une ligne de quatre compteurs ne se lit pas d'un coup d'œil.
      */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <AquaTube percent={percent} label="Analyse en cours" />
        </div>
        <span className="w-[46px] shrink-0 text-right text-[17px] leading-none font-bold tabular-nums">
          {percent}
          <span className="text-[11px] font-normal"> %</span>
        </span>
      </div>

      {/*
        Une phrase plutôt qu'un tableau de bord : les quatre compteurs,
        comprimés, se coupaient au milieu — on lisait « Analysés 0 / » sur une
        ligne et « : 897 » sur la suivante.
      */}
      <p className="text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {done}
        </span>{' '}
        rangés sur <span className="tabular-nums">{total}</span>
        {' · '}lot <span className="tabular-nums">{batchNumber}</span> sur{' '}
        <span className="tabular-nums">{batchTotal}</span>
        {' · '}
        {done >= total
          ? 'écriture des propositions…'
          : done === 0
            ? `${formatDuration(elapsedSeconds)} écoulées`
            : `environ ${formatDuration(remainingSeconds)} restantes`}
      </p>

      {notice !== null && (
        <p className="rounded-[4px] border border-[#e8d9a8] bg-[#fdf7e3] px-2 py-1 text-[11px]">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-[170px] overflow-y-auto rounded-[4px] border border-[#d2d9e6] bg-white p-1.5 lg:h-[300px]">
          {log.length === 0 ? (
            <p className="p-1 text-[11px] text-muted-foreground">
              Envoi du premier lot…
            </p>
          ) : (
            <ul className="space-y-0.5 text-[11px]">
              {log.map((entry, index) => (
                <li key={`${entry.title}-${index}`} className="flex gap-1.5">
                  <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    → {entry.folderPath}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-[170px] overflow-y-auto rounded-[4px] border border-[#d2d9e6] bg-white p-1.5 lg:h-[300px]">
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`

  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)

  return `${minutes} min ${String(rest).padStart(2, '0')} s`
}
