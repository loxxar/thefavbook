/**
 * Modèle de données issu du parsing d'un fichier de favoris.
 * Volontairement découplé de Prisma : le parseur et l'export doivent être
 * testables sans base de données.
 */

export interface ParsedBookmark {
  kind: 'bookmark'
  title: string
  /** URL telle qu'écrite dans le fichier source, jamais réécrite. */
  url: string
  addDate: Date | null
  lastModified: Date | null
  /** Contenu du <DD> qui suit le <DT>, quand le navigateur en exporte un. */
  description: string | null
  /** Favicon inline (attribut ICON, data: URI). Peut peser plusieurs Ko. */
  iconDataUri: string | null
  /** URL du favicon (attribut ICON_URI). */
  iconUrl: string | null
  /** Attribut TAGS, propre à Firefox : liste séparée par des virgules. */
  tags: string[]
}

export interface ParsedFolder {
  kind: 'folder'
  title: string
  addDate: Date | null
  lastModified: Date | null
  /** PERSONAL_TOOLBAR_FOLDER="true" : la barre de favoris du navigateur. */
  isToolbar: boolean
  children: ParsedNode[]
}

export type ParsedNode = ParsedFolder | ParsedBookmark

export function isFolder(node: ParsedNode): node is ParsedFolder {
  return node.kind === 'folder'
}

export function isBookmark(node: ParsedNode): node is ParsedBookmark {
  return node.kind === 'bookmark'
}

/** Parcours en profondeur, dossiers et favoris confondus. */
export function* walk(
  nodes: readonly ParsedNode[],
): Generator<{ node: ParsedNode; depth: number }> {
  for (const node of nodes) {
    yield { node, depth: 0 }
    if (isFolder(node)) {
      for (const nested of walk(node.children)) {
        yield { node: nested.node, depth: nested.depth + 1 }
      }
    }
  }
}

export function countBookmarks(nodes: readonly ParsedNode[]): number {
  let total = 0
  for (const { node } of walk(nodes)) {
    if (isBookmark(node)) total += 1
  }
  return total
}
