'use client'

import { AquaButton, StatusSphere } from '@/components/aqua/aqua-controls'
import { useTranslations } from '@/components/i18n/translations-provider'
import type { BookmarkRow, RowHealth } from '@/lib/bookmarks/rows'
import type { Locale } from '@/lib/i18n/config'

export type SortKey = 'title' | 'host' | 'health' | 'addedAt'

/*
 * Largeurs de colonnes, partagées par l'en-tête et les lignes.
 *
 * Le nom garde un plancher : sans lui, les colonnes fixes consommaient toute
 * la largeur disponible et la colonne titre tombait à zéro — il ne restait
 * qu'un domaine et une date, sur un écran de 900 pixels.
 *
 * L'adresse s'efface la première quand la place manque : le domaine se
 * retrouve dans l'inspecteur, alors que le titre est le seul repère pour
 * reconnaître un favori.
 */
const COL_NAME = 'min-w-[160px] flex-1'
const COL_HOST = 'hidden w-[210px] xl:flex'
const COL_STATUS = 'w-[150px]'
const COL_DATE = 'w-[88px]'

interface BookmarkTableProps {
  rows: BookmarkRow[]
  total: number
  selectedId: string | null
  onSelect: (row: BookmarkRow) => void
  sort: { key: SortKey; ascending: boolean }
  onSort: (key: SortKey) => void
  onShowMore: () => void
  locale: Locale
  onDragRow: (id: string) => void
}

/**
 * Vue en liste, dense.
 *
 * POURQUOI un plafond d'affichage plutôt qu'une virtualisation : quelques
 * milliers de lignes en DOM figent le défilement, et une bibliothèque de
 * fenêtrage coûterait plus cher que le bouton qui rallonge la liste. Le
 * filtrage porte sur l'ensemble ; seul le rendu est borné.
 */
export function BookmarkTable({
  rows,
  total,
  selectedId,
  onSelect,
  sort,
  onSort,
  onShowMore,
  locale,
  onDragRow,
}: BookmarkTableProps) {
  const { t } = useTranslations()

  const healthLabel: Record<RowHealth, string> = {
    ok: t.workspace.statusOk,
    dead: t.workspace.statusDead,
    unknown: t.workspace.statusUnknown,
    idle: t.workspace.statusIdle,
  }

  const sortedLabels = {
    ascending: t.workspace.sortedAscending,
    descending: t.workspace.sortedDescending,
  }

  const dates = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  if (total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-6 text-[12px] text-muted-foreground">
        {t.workspace.emptyList}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="aqua-listheader flex shrink-0 text-[10px] font-bold text-[#4a4a4a]">
        <HeaderCell
          sortedLabels={sortedLabels}
          label={t.workspace.colName}
          active={sort.key === 'title'}
          ascending={sort.ascending}
          onClick={() => onSort('title')}
          className={COL_NAME}
        />
        <HeaderCell
          sortedLabels={sortedLabels}
          label={t.workspace.colUrl}
          active={sort.key === 'host'}
          ascending={sort.ascending}
          onClick={() => onSort('host')}
          className={COL_HOST}
        />
        <HeaderCell
          sortedLabels={sortedLabels}
          label={t.workspace.colStatus}
          active={sort.key === 'health'}
          ascending={sort.ascending}
          onClick={() => onSort('health')}
          className={COL_STATUS}
        />
        <HeaderCell
          sortedLabels={sortedLabels}
          label={t.workspace.colDate}
          active={sort.key === 'addedAt'}
          ascending={sort.ascending}
          onClick={() => onSort('addedAt')}
          className={COL_DATE}
        />
      </div>

      <ul className="aqua-list min-h-0 flex-1 overflow-y-auto">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              data-selected={row.id === selectedId}
              onClick={() => onSelect(row)}
              // Glisser vers un dossier de la source list, comme au Finder.
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', row.id)
                onDragRow(row.id)
              }}
              className="aqua-row flex w-full items-center py-[3px] text-left text-[11px]"
            >
              <span
                className={`flex items-center gap-2 truncate px-2 ${COL_NAME}`}
              >
                <span className="truncate">{row.title}</span>
                {row.suggestion !== null && (
                  <span
                    className="aqua-row-muted shrink-0 text-[10px] text-[#1c5fd6]"
                    title={t.workspace.aiProposal}
                  >
                    ✦
                  </span>
                )}
              </span>

              <span className={`aqua-row-muted truncate px-2 ${COL_HOST}`}>
                {row.host}
              </span>

              <span
                className={`flex items-center gap-[6px] px-2 ${COL_STATUS}`}
              >
                <StatusSphere
                  health={row.health}
                  label={healthLabel[row.health]}
                />
                <span className="truncate">{healthLabel[row.health]}</span>
              </span>

              <span
                className={`aqua-row-muted px-2 text-right tabular-nums ${COL_DATE}`}
              >
                {row.addedAt === null ? '—' : dates.format(row.addedAt)}
              </span>
            </button>
          </li>
        ))}

        {rows.length < total && (
          <li className="flex items-center justify-center gap-3 border-t border-[#e0e0e0] p-2">
            <span className="text-[11px] text-muted-foreground">
              {t.workspace.shownOf(rows.length, total)}
            </span>
            <AquaButton onClick={onShowMore}>{t.workspace.showMore}</AquaButton>
          </li>
        )}
      </ul>
    </div>
  )
}

/**
 * POURQUOI pas `aria-sort` : il n'a de sens que sur un `columnheader`, et
 * l'en-tête est ici une rangée de boutons, pas une table sémantique. L'ordre
 * courant passe donc par un texte réservé aux lecteurs d'écran — le triangle
 * seul ne dit rien à qui ne le voit pas.
 */
function HeaderCell({
  label,
  active,
  ascending,
  onClick,
  className,
  sortedLabels,
}: {
  label: string
  active: boolean
  ascending: boolean
  onClick: () => void
  className: string
  sortedLabels: { ascending: string; descending: string }
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aqua-listheader-cell flex items-center gap-1 px-2 py-[3px] text-left hover:bg-white/50 ${className}`}
    >
      <span className="truncate">{label}</span>
      {active && (
        <>
          <span aria-hidden>{ascending ? '▲' : '▼'}</span>
          <span className="sr-only">
            {ascending ? sortedLabels.ascending : sortedLabels.descending}
          </span>
        </>
      )}
    </button>
  )
}
