'use client'

import { useDraggable } from '@dnd-kit/core'

import { FolderRow } from '@/components/bookmarks/folder-row'

import {
  isFolder,
  type ParsedBookmark,
  type ParsedNode,
} from '@/lib/bookmarks/types'

interface BookmarkTreeProps {
  nodes: readonly ParsedNode[]
  selectedUrl: string | null
  onSelect: (bookmark: ParsedBookmark) => void
}

/**
 * Arbre fusionné, avec déplacement des favoris par glisser-déposer.
 *
 * Les dossiers sont des `<details>` natifs : pliage sans JavaScript,
 * accessible au clavier d'origine.
 */
export function BookmarkTree({
  nodes,
  selectedUrl,
  onSelect,
}: BookmarkTreeProps) {
  if (nodes.length === 0) return null

  return (
    <ul className="space-y-0.5 text-[12px]">
      {nodes.map((node, index) => (
        <li key={`${node.kind}-${node.id ?? node.title}-${index}`}>
          {isFolder(node) ? (
            <FolderRow node={node} open={index === 0}>
              <BookmarkTree
                nodes={node.children}
                selectedUrl={selectedUrl}
                onSelect={onSelect}
              />
            </FolderRow>
          ) : (
            <BookmarkRow
              node={node}
              isSelected={selectedUrl === node.url}
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

interface BookmarkRowProps {
  node: ParsedBookmark
  isSelected: boolean
  onSelect: (bookmark: ParsedBookmark) => void
}

function BookmarkRow({ node, isSelected, onSelect }: BookmarkRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id ?? `sans-id-${node.url}`,
    disabled: node.id === undefined,
    data: { title: node.title, url: node.url },
  })

  return (
    <a
      ref={setNodeRef}
      href={node.url}
      title={node.url}
      onClick={(event) => {
        // Les clics « ouvrir ailleurs » gardent leur comportement.
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.button !== 0
        ) {
          return
        }
        event.preventDefault()
        onSelect(node)
      }}
      className={`block truncate rounded-[4px] px-1 py-0.5 ${
        isDragging ? 'opacity-40' : ''
      } ${
        isSelected
          ? 'bg-[linear-gradient(to_bottom,var(--accent-top),var(--accent-bottom))] text-white'
          : 'hover:bg-[#e6ebf4]'
      }`}
      {...listeners}
      {...attributes}
    >
      {node.title === '' ? node.url : node.title}
    </a>
  )
}
