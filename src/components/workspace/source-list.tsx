'use client'

import { useState } from 'react'

import { AquaBadge } from '@/components/aqua/aqua-controls'
import { useTranslations } from '@/components/i18n/translations-provider'
import type { View } from '@/components/workspace/views'
import type { FolderNode, WorkspaceData } from '@/lib/bookmarks/rows'

interface SourceListProps {
  view: View
  onSelect: (view: View) => void
  folders: FolderNode[]
  counts: WorkspaceData['counts']
  /** Dépôt d'un favori sur un dossier. `null` : la racine de l'espace. */
  onDropOnFolder: (folderId: string | null) => void
}

function sameView(a: View, b: View): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'folder' && b.kind === 'folder') return a.id === b.id

  return true
}

/**
 * Source list façon iTunes : des groupes en petites capitales, des entrées
 * compactes, et un compteur à droite là où il apprend quelque chose.
 *
 * Les dossiers sont rendus à plat avec un retrait par niveau. Un arbre
 * dépliable ferait perdre la vue d'ensemble sur cinq cents dossiers, alors que
 * la liste reste parcourable d'un coup d'œil.
 */
export function SourceList({
  view,
  onSelect,
  folders,
  counts,
  onDropOnFolder,
}: SourceListProps) {
  const { t } = useTranslations()

  return (
    <nav className="aqua-sourcelist w-[210px] shrink-0 overflow-y-auto px-2 py-2 text-[11px] select-none">
      <Group label={t.workspace.library}>
        <Item
          label={t.workspace.allBookmarks}
          badge={counts.total}
          selected={sameView(view, { kind: 'all' })}
          onSelect={() => onSelect({ kind: 'all' })}
        />
        <Item
          label={t.workspace.recent}
          selected={sameView(view, { kind: 'recent' })}
          onSelect={() => onSelect({ kind: 'recent' })}
        />
        <Item
          label={t.workspace.unfiled}
          selected={sameView(view, { kind: 'unfiled' })}
          onSelect={() => onSelect({ kind: 'unfiled' })}
          onDrop={() => onDropOnFolder(null)}
        />
      </Group>

      <Group label={t.workspace.maintenanceGroup}>
        <Item
          label={t.workspace.deadLinks}
          badge={counts.dead}
          tone="dead"
          selected={sameView(view, { kind: 'dead' })}
          onSelect={() => onSelect({ kind: 'dead' })}
        />
        <Item
          label={t.workspace.unknownLinks}
          badge={counts.unknown}
          tone="warn"
          selected={sameView(view, { kind: 'unknown' })}
          onSelect={() => onSelect({ kind: 'unknown' })}
        />
        <Item
          label={t.workspace.duplicates}
          badge={counts.duplicates}
          tone="warn"
          selected={sameView(view, { kind: 'duplicates' })}
          onSelect={() => onSelect({ kind: 'duplicates' })}
        />
      </Group>

      <Group label={t.workspace.intelligence}>
        <Item
          label={t.workspace.aiSuggestions}
          badge={counts.suggestions}
          selected={sameView(view, { kind: 'suggestions' })}
          onSelect={() => onSelect({ kind: 'suggestions' })}
        />
      </Group>

      {folders.length > 0 && (
        <Group label={t.workspace.foldersGroup}>
          {folders.map((folder) => (
            <Item
              key={folder.id}
              label={folder.name}
              depth={folder.depth}
              badge={folder.count}
              selected={sameView(view, { kind: 'folder', id: folder.id })}
              onSelect={() => onSelect({ kind: 'folder', id: folder.id })}
              onDrop={() => onDropOnFolder(folder.id)}
            />
          ))}
        </Group>
      )}
    </nav>
  )
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <h2 className="mb-1 px-2 text-[10px] font-bold tracking-wide text-[#63708a] uppercase">
        {label}
      </h2>
      <ul className="space-y-[1px]">{children}</ul>
    </div>
  )
}

function Item({
  label,
  badge,
  tone = 'default',
  depth = 0,
  selected,
  onSelect,
  onDrop,
}: {
  label: string
  badge?: number
  tone?: 'default' | 'dead' | 'warn'
  depth?: number
  selected: boolean
  onSelect: () => void
  onDrop?: () => void
}) {
  const [isOver, setIsOver] = useState(false)

  return (
    <li>
      <button
        type="button"
        data-selected={selected}
        onClick={onSelect}
        // Seules les entrées qui désignent un rangement acceptent un dépôt :
        // lâcher un favori sur « Liens morts » ne voudrait rien dire.
        onDragOver={
          onDrop === undefined
            ? undefined
            : (event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setIsOver(true)
              }
        }
        onDragLeave={onDrop === undefined ? undefined : () => setIsOver(false)}
        onDrop={
          onDrop === undefined
            ? undefined
            : (event) => {
                event.preventDefault()
                setIsOver(false)
                onDrop()
              }
        }
        style={{
          paddingLeft: `${8 + Math.min(depth, 4) * 11}px`,
          outline: isOver ? '2px solid #1c5fd6' : undefined,
        }}
        // Le retrait suit la profondeur du dossier ; au-delà de quatre niveaux
        // il se fige, faute de quoi le libellé ne tiendrait plus.
        className="aqua-sourcelist-item flex w-full items-center gap-2 py-[3px] pr-2 text-left"
      >
        <span className="flex-1 truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <AquaBadge tone={tone}>{badge}</AquaBadge>
        )}
      </button>
    </li>
  )
}
