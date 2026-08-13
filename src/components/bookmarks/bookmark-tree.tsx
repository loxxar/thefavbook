import { isFolder, type ParsedNode } from '@/lib/bookmarks/types'

interface BookmarkTreeProps {
  nodes: readonly ParsedNode[]
}

/**
 * Arbre fusionné, en lecture seule.
 *
 * Les dossiers sont des <details> natifs : pliage sans JavaScript, accessible
 * au clavier d'origine. Le tri manuel et le glisser-déposer viendront plus
 * tard — ils supposent un état client dont on n'a pas encore besoin.
 */
export function BookmarkTree({ nodes }: BookmarkTreeProps) {
  if (nodes.length === 0) return null

  return (
    <ul className="space-y-0.5 text-[12px]">
      {nodes.map((node, index) => (
        <li key={`${node.kind}-${node.title}-${index}`}>
          {isFolder(node) ? (
            <details open={index === 0} className="group">
              <summary className="cursor-default rounded-[4px] px-1 py-0.5 marker:text-[#6b7280] hover:bg-[#e6ebf4]">
                <span className="font-semibold">{node.title}</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">
                  {node.children.length}
                </span>
              </summary>
              <div className="ml-4 border-l border-[#d2d9e6] pl-2">
                <BookmarkTree nodes={node.children} />
              </div>
            </details>
          ) : (
            <a
              href={node.url}
              target="_blank"
              rel="noreferrer noopener"
              title={node.url}
              className="block truncate rounded-[4px] px-1 py-0.5 hover:bg-[#e6ebf4] hover:underline"
            >
              {node.title === '' ? node.url : node.title}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
