'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { BookmarkTree } from '@/components/bookmarks/bookmark-tree'
import { PreviewPanel } from '@/components/bookmarks/preview-panel'
import { moveBookmarkAction } from '@/lib/bookmarks/move-actions'
import type { ParsedBookmark, ParsedNode } from '@/lib/bookmarks/types'

interface BookmarkBrowserProps {
  nodes: ParsedNode[]
  spaceId: string
}

/**
 * Arbre à gauche, favori sélectionné à droite.
 *
 * En dessous de `lg`, le panneau passe sous l'arbre : côte à côte, aucun des
 * deux ne serait lisible.
 */
export function BookmarkBrowser({ nodes, spaceId }: BookmarkBrowserProps) {
  const [selected, setSelected] = useState<ParsedBookmark | null>(null)
  const [dragged, setDragged] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Sans distance minimale, le moindre clic déclencherait un glissement et on
  // ne pourrait plus sélectionner un favori.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  function onDragStart(event: DragStartEvent) {
    const title = event.active.data.current?.title

    setDragged(typeof title === 'string' && title !== '' ? title : 'Ce favori')
  }

  function onDragEnd(event: DragEndEvent) {
    setDragged(null)

    const { active, over } = event

    if (over === null) return

    const bookmarkId = String(active.id)
    const folderId = String(over.id)

    startTransition(async () => {
      const result = await moveBookmarkAction(bookmarkId, folderId)

      if (!result.ok) {
        if (result.message !== '') toast.error(result.message)
        return
      }

      // Un déplacement raté sur quelques milliers de favoris sans retour
      // arrière serait invivable : l'annulation est proposée aussitôt.
      toast.success('Favori déplacé.', {
        action: {
          label: 'Annuler',
          onClick: () => {
            startTransition(async () => {
              await moveBookmarkAction(bookmarkId, result.previousFolderId)
            })
          },
        },
      })
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragged(null)}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto rounded-[6px] border border-[#d2d9e6] p-2">
          <BookmarkTree
            nodes={nodes}
            selectedUrl={selected?.url ?? null}
            onSelect={setSelected}
            spaceId={spaceId}
          />
        </div>

        <div className="min-h-[220px] lg:min-h-0">
          <PreviewPanel key={selected?.url ?? 'vide'} bookmark={selected} />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragged !== null && (
          <div className="max-w-[280px] truncate rounded-[4px] border border-[#1a4fae] bg-[linear-gradient(to_bottom,#8fc0ff,#4a8ae8_50%,#2f6fd8)] px-2 py-0.5 text-[12px] text-white shadow-lg">
            {dragged}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
