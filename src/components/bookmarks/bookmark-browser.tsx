'use client'

import { useState } from 'react'

import { BookmarkTree } from '@/components/bookmarks/bookmark-tree'
import { PreviewPanel } from '@/components/bookmarks/preview-panel'
import type { ParsedBookmark, ParsedNode } from '@/lib/bookmarks/types'

interface BookmarkBrowserProps {
  nodes: ParsedNode[]
}

/**
 * Arbre à gauche, favori sélectionné à droite.
 *
 * En dessous de `lg`, le panneau passe sous l'arbre : côte à côte, aucun des
 * deux ne serait lisible.
 */
export function BookmarkBrowser({ nodes }: BookmarkBrowserProps) {
  const [selected, setSelected] = useState<ParsedBookmark | null>(null)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-h-0 overflow-y-auto rounded-[6px] border border-[#d2d9e6] p-2">
        <BookmarkTree
          nodes={nodes}
          selectedUrl={selected?.url ?? null}
          onSelect={setSelected}
        />
      </div>

      <div className="min-h-[220px] lg:min-h-0">
        <PreviewPanel key={selected?.url ?? 'vide'} bookmark={selected} />
      </div>
    </div>
  )
}
