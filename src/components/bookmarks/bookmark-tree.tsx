'use client'

import { isFolder, type ParsedBookmark, type ParsedNode } from '@/lib/bookmarks/types'

interface BookmarkTreeProps {
  nodes: readonly ParsedNode[]
  selectedUrl: string | null
  onSelect: (bookmark: ParsedBookmark) => void
}

/**
 * Arbre fusionné, en lecture seule.
 *
 * Les dossiers sont des `<details>` natifs : pliage sans JavaScript, accessible
 * au clavier d'origine.
 *
 * Cliquer un favori ne quitte pas la page — il s'affiche dans le panneau de
 * droite. Le lien reste un vrai `<a>` malgré tout : clic milieu, Cmd-clic et
 * « ouvrir dans un nouvel onglet » du menu contextuel doivent continuer de
 * fonctionner.
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
        <li key={`${node.kind}-${node.title}-${index}`}>
          {isFolder(node) ? (
            <details open={index === 0}>
              <summary className="cursor-default rounded-[4px] px-1 py-0.5 marker:text-[#6b7280] hover:bg-[#e6ebf4]">
                <span className="font-semibold">{node.title}</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">
                  {node.children.length}
                </span>
              </summary>
              <div className="ml-4 border-l border-[#d2d9e6] pl-2">
                <BookmarkTree
                  nodes={node.children}
                  selectedUrl={selectedUrl}
                  onSelect={onSelect}
                />
              </div>
            </details>
          ) : (
            <a
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
              className={`block truncate rounded-[4px] px-1 py-0.5 hover:bg-[#e6ebf4] ${
                selectedUrl === node.url
                  ? 'bg-[linear-gradient(to_bottom,var(--accent-top),var(--accent-bottom))] text-white'
                  : ''
              }`}
            >
              {node.title === '' ? node.url : node.title}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
