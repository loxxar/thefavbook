'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { AquaButton, AquaTube } from '@/components/aqua/aqua-controls'
import { useTranslations } from '@/components/i18n/translations-provider'
import {
  BookmarkTable,
  type SortKey,
} from '@/components/workspace/bookmark-table'
import { Inspector } from '@/components/workspace/inspector'
import { SourceList } from '@/components/workspace/source-list'
import {
  duplicateKeys,
  matchesQuery,
  matchesView,
  type View,
} from '@/components/workspace/views'
import { cleanUpAction } from '@/lib/bookmarks/cleanup-actions'
import {
  deleteFolderAction,
  renameFolderAction,
} from '@/lib/bookmarks/folder-actions'
import { moveBookmarkAction } from '@/lib/bookmarks/move-actions'
import { checkNextLinksAction } from '@/lib/bookmarks/link-check-actions'
import { DELAY_BETWEEN_CHECK_BATCHES_MS } from '@/lib/bookmarks/link-check-state'
import type { BookmarkRow, WorkspaceData } from '@/lib/bookmarks/rows'
import type { Locale } from '@/lib/i18n/config'

interface WorkspaceProps {
  data: WorkspaceData
  spaceId: string
  spaceName: string
  locale: Locale
  onImport: () => void
  onExport: () => void
  onClassify: () => void
  canExport: boolean
}

/** Rendu borné : au-delà, le défilement se met à traîner. */
const PAGE = 200

const HEALTH_ORDER: Record<BookmarkRow['health'], number> = {
  dead: 0,
  unknown: 1,
  idle: 2,
  ok: 3,
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fenêtre unique de l'application.
 *
 * POURQUOI une fenêtre et trois colonnes plutôt que des panneaux empilés : le
 * contenu utile est étroit et haut. Réparti sur la largeur, il tenait sur un
 * tiers de l'écran et imposait de défiler la page entière pour passer d'une
 * tâche à l'autre. Source list, liste et inspecteur défilent désormais chacun
 * chez soi, et tout reste visible d'un coup d'œil.
 */
export function Workspace({
  data,
  spaceId,
  spaceName,
  locale,
  onImport,
  onExport,
  onClassify,
  canExport,
}: WorkspaceProps) {
  const { t } = useTranslations()
  const router = useRouter()

  const [view, setView] = useState<View>({ kind: 'all' })
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({
    key: 'title',
    ascending: true,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showInspector, setShowInspector] = useState(true)
  const [limit, setLimit] = useState(PAGE)
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const dragged = useRef<string | null>(null)

  const [isCleaning, startCleaning] = useTransition()
  const [checking, setChecking] = useState<{
    done: number
    total: number
  } | null>(null)

  // Le dédoublonnage se calcule une fois par jeu de lignes, pas à chaque frappe.
  const duplicates = useMemo(() => duplicateKeys(data.rows), [data.rows])

  const visible = useMemo(() => {
    const now = Date.now()

    const filtered = data.rows.filter(
      (row) =>
        !removed.has(row.id) &&
        matchesView(row, view, duplicates, now) &&
        matchesQuery(row, query),
    )

    const direction = sort.ascending ? 1 : -1

    return filtered.sort((a, b) => {
      switch (sort.key) {
        case 'title':
          return a.title.localeCompare(b.title) * direction
        case 'host':
          return a.host.localeCompare(b.host) * direction
        case 'health':
          return (HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]) * direction
        case 'addedAt':
          return ((a.addedAt ?? 0) - (b.addedAt ?? 0)) * direction
      }
    })
  }, [data.rows, removed, view, duplicates, query, sort])

  const selected = visible.find((row) => row.id === selectedId) ?? null

  function changeView(next: View) {
    setView(next)
    setLimit(PAGE)
  }

  function changeSort(key: SortKey) {
    setSort((previous) =>
      previous.key === key
        ? { key, ascending: !previous.ascending }
        : { key, ascending: true },
    )
  }

  /**
   * Campagne de vérification.
   *
   * Le serveur traite un lot par appel et le client rappelle : quelques
   * milliers de requêtes sortantes dépasseraient le temps d'exécution d'une
   * fonction. La jauge suit le nombre réellement traité, elle ne simule rien.
   */
  async function runCheck() {
    const total = data.counts.unchecked

    if (total === 0) return

    setChecking({ done: 0, total })

    for (;;) {
      const result = await checkNextLinksAction(spaceId)

      if (result.status === 'error') {
        toast.error(result.message)
        break
      }

      setChecking({ done: total - result.remaining, total })

      if (result.status === 'done') {
        toast.success(t.maintenance.checkDone)
        break
      }

      await wait(DELAY_BETWEEN_CHECK_BATCHES_MS)
    }

    setChecking(null)
    router.refresh()
  }

  /** Dépôt d'un favori sur un dossier de la source list. */
  function dropOnFolder(folderId: string | null) {
    const bookmarkId = dragged.current

    if (bookmarkId === null) return

    dragged.current = null

    startCleaning(async () => {
      const result = await moveBookmarkAction(bookmarkId, folderId)

      if (result.ok) {
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const currentFolder =
    view.kind === 'folder'
      ? (data.folders.find((f) => f.id === view.id) ?? null)
      : null

  const cleanable = data.counts.dead + data.counts.duplicates

  return (
    <div className="aqua-window mx-3 mb-3 flex min-h-0 flex-1 flex-col">
      {/* Barre de titre en métal brossé, matériau des applications « appareil ». */}
      <div className="aqua-brushed flex h-[26px] shrink-0 items-center px-2">
        <div className="flex gap-[6px]" aria-hidden>
          <Light color="#ff5f57" />
          <Light color="#febc2e" />
          <Light color="#28c840" />
        </div>

        <h1 className="flex-1 text-center text-[11px] font-bold text-[#3a3a3a]">
          {spaceName}
        </h1>

        <div className="w-[54px]" />
      </div>

      <div className="aqua-brushed flex shrink-0 flex-wrap items-center gap-2 px-2 py-[6px]">
        <AquaButton onClick={onImport}>{t.menu.import}</AquaButton>
        <AquaButton onClick={onExport} disabled={!canExport}>
          {t.menu.export}
        </AquaButton>

        <span className="mx-1 h-[18px] w-px bg-[#a8a8a8]" aria-hidden />

        <AquaButton
          onClick={() => void runCheck()}
          disabled={checking !== null || data.counts.unchecked === 0}
        >
          {checking === null
            ? t.maintenance.checkLinks
            : t.maintenance.checking}
        </AquaButton>

        <AquaButton tone="primary" onClick={onClassify}>
          {t.dashboard.sortWithAi}
        </AquaButton>

        <AquaButton
          tone="danger"
          disabled={isCleaning || cleanable === 0}
          onClick={() => {
            if (cleanable === 0) {
              toast.message(t.workspace.nothingToClean)
              return
            }

            const confirmed = confirm(
              t.workspace.cleanSummary(
                data.counts.dead,
                data.counts.duplicates,
              ),
            )

            if (!confirmed) return

            startCleaning(async () => {
              const result = await cleanUpAction(spaceId)
              toast.success(
                t.workspace.cleanDone(
                  result.removedDead + result.removedDuplicates,
                ),
              )
              router.refresh()
            })
          }}
        >
          {isCleaning ? t.workspace.cleaning : t.workspace.cleanAll}
        </AquaButton>

        {/*
          Les actions de dossier n'apparaissent que sur un dossier ouvert : les
          proposer en permanence obligerait à demander « lequel ? » à chaque
          clic.
        */}
        {currentFolder !== null && (
          <>
            <span className="mx-1 h-[18px] w-px bg-[#a8a8a8]" aria-hidden />

            <AquaButton
              disabled={isCleaning}
              onClick={() => {
                const name = prompt(
                  t.workspace.renameFolder,
                  currentFolder.name,
                )

                if (name === null || name.trim() === '') return

                startCleaning(async () => {
                  const result = await renameFolderAction(
                    currentFolder.id,
                    name,
                  )

                  if (result.ok) {
                    router.refresh()
                  } else {
                    toast.error(result.message)
                  }
                })
              }}
            >
              {t.workspace.renameFolder}
            </AquaButton>

            <AquaButton
              disabled={isCleaning}
              onClick={() => {
                if (!confirm(t.workspace.confirmDeleteFolder)) return

                startCleaning(async () => {
                  const result = await deleteFolderAction(currentFolder.id)

                  if (result.ok) {
                    setView({ kind: 'all' })
                    router.refresh()
                  } else {
                    toast.error(result.message)
                  }
                })
              }}
            >
              {t.workspace.deleteFolder}
            </AquaButton>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <AquaButton onClick={() => setShowInspector((open) => !open)}>
            {showInspector
              ? t.workspace.hideInspector
              : t.workspace.showInspector}
          </AquaButton>

          <label className="aqua-search flex items-center gap-1 px-2 py-[2px]">
            <span aria-hidden className="text-[10px] text-[#8a94a6]">
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setLimit(PAGE)
              }}
              placeholder={t.workspace.searchPlaceholder}
              aria-label={t.workspace.searchPlaceholder}
              className="w-[130px] bg-transparent text-[11px] outline-none"
            />
          </label>
        </div>
      </div>

      {(checking !== null || isCleaning) && (
        <div className="shrink-0 border-b border-[#aeaeae] bg-[#eef2f7] px-3 py-[6px]">
          <AquaTube
            percent={
              checking === null
                ? 100
                : Math.round((checking.done / checking.total) * 100)
            }
            label={
              checking === null ? t.workspace.cleaning : t.maintenance.checking
            }
          />
          {checking !== null && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t.maintenance.checkProgress(checking.done, checking.total)}
            </p>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <SourceList
          view={view}
          onSelect={changeView}
          folders={data.folders}
          counts={data.counts}
          onDropOnFolder={dropOnFolder}
        />

        <div className="flex min-w-0 flex-1 flex-col border-r border-[#b8b8b8]">
          <BookmarkTable
            rows={visible.slice(0, limit)}
            total={visible.length}
            selectedId={selectedId}
            onSelect={(row) => setSelectedId(row.id)}
            sort={sort}
            onSort={changeSort}
            onShowMore={() => setLimit((current) => current + PAGE)}
            locale={locale}
            onDragRow={(id) => {
              dragged.current = id
            }}
          />
        </div>

        {showInspector && (
          <aside className="w-[260px] shrink-0 overflow-hidden bg-[#f4f6fa]">
            <Inspector
              row={selected}
              locale={locale}
              onDeleted={(id) => {
                setRemoved((current) => new Set(current).add(id))
                setSelectedId(null)
              }}
            />
          </aside>
        )}
      </div>

      <div className="aqua-statusbar flex shrink-0 items-center gap-3 px-3 py-[3px] text-[10px] text-[#4a4a4a]">
        <span>{t.workspace.shownOf(visible.length, data.counts.total)}</span>
        {data.counts.dead > 0 && (
          <span>
            {t.workspace.deadLinks} : {data.counts.dead}
          </span>
        )}
        {data.counts.duplicates > 0 && (
          <span>
            {t.workspace.duplicates} : {data.counts.duplicates}
          </span>
        )}
        {data.counts.unchecked > 0 && (
          <span>
            {t.maintenance.unchecked} : {data.counts.unchecked}
          </span>
        )}
      </div>
    </div>
  )
}

function Light({ color }: { color: string }) {
  return (
    <span
      className="aqua-sphere"
      style={{
        width: 11,
        height: 11,
        background: `radial-gradient(circle at 35% 30%, ${color}dd, ${color} 60%, ${color}99)`,
      }}
    />
  )
}
