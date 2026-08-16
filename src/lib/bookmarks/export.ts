import {
  isFolder,
  type ParsedBookmark,
  type ParsedFolder,
  type ParsedNode,
} from './types'

/**
 * Écriture au Netscape Bookmark File Format.
 *
 * Le fichier produit doit être réimportable tel quel dans n'importe quel
 * navigateur : c'est la porte de sortie du produit, et la garantie que les
 * données ne sont jamais captives de l'application.
 */

export interface ExportOptions {
  /** Titre du document. Les navigateurs affichent « Bookmarks » par défaut. */
  title?: string
  /**
   * Réémettre les favicons inline (attribut ICON). Ils gonflent le fichier de
   * façon spectaculaire — souvent plusieurs Mo pour quelques milliers de
   * favoris — pour un gain nul à la réimportation, le navigateur les
   * retéléchargeant de toute façon.
   */
  includeIcons?: boolean
}

const INDENT = '    '

export function exportNetscapeBookmarks(
  nodes: readonly ParsedNode[],
  options: ExportOptions = {},
): string {
  const { title = 'Bookmarks', includeIcons = false } = options

  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    '     It will be read and overwritten.',
    '     DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    `<TITLE>${escapeText(title)}</TITLE>`,
    `<H1>${escapeText(title)}</H1>`,
    '<DL><p>',
  ]

  for (const node of nodes) {
    writeNode(node, 1, lines, includeIcons)
  }

  lines.push('</DL><p>', '')
  return lines.join('\n')
}

function writeNode(
  node: ParsedNode,
  depth: number,
  lines: string[],
  includeIcons: boolean,
): void {
  if (isFolder(node)) {
    writeFolder(node, depth, lines, includeIcons)
  } else {
    writeBookmark(node, depth, lines, includeIcons)
  }
}

function writeFolder(
  folder: ParsedFolder,
  depth: number,
  lines: string[],
  includeIcons: boolean,
): void {
  const pad = INDENT.repeat(depth)
  const attributes = [
    formatDateAttribute('ADD_DATE', folder.addDate),
    formatDateAttribute('LAST_MODIFIED', folder.lastModified),
    folder.isToolbar ? 'PERSONAL_TOOLBAR_FOLDER="true"' : null,
  ].filter((attribute): attribute is string => attribute !== null)

  const suffix = attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
  lines.push(`${pad}<DT><H3${suffix}>${escapeText(folder.title)}</H3>`)
  lines.push(`${pad}<DL><p>`)

  for (const child of folder.children) {
    writeNode(child, depth + 1, lines, includeIcons)
  }

  lines.push(`${pad}</DL><p>`)
}

function writeBookmark(
  bookmark: ParsedBookmark,
  depth: number,
  lines: string[],
  includeIcons: boolean,
): void {
  const pad = INDENT.repeat(depth)
  const attributes = [
    `HREF="${escapeAttribute(bookmark.url)}"`,
    formatDateAttribute('ADD_DATE', bookmark.addDate),
    formatDateAttribute('LAST_MODIFIED', bookmark.lastModified),
    bookmark.tags.length > 0
      ? `TAGS="${escapeAttribute(bookmark.tags.join(','))}"`
      : null,
    bookmark.iconUrl !== null
      ? `ICON_URI="${escapeAttribute(bookmark.iconUrl)}"`
      : null,
    includeIcons && bookmark.iconDataUri !== null
      ? `ICON="${escapeAttribute(bookmark.iconDataUri)}"`
      : null,
  ].filter((attribute): attribute is string => attribute !== null)

  lines.push(
    `${pad}<DT><A ${attributes.join(' ')}>${escapeText(bookmark.title)}</A>`,
  )

  if (bookmark.description !== null && bookmark.description !== '') {
    lines.push(`${pad}<DD>${escapeText(bookmark.description)}`)
  }
}

/** Le format attend des secondes Unix, pas des millisecondes. */
function formatDateAttribute(name: string, date: Date | null): string | null {
  if (date === null) return null
  return `${name}="${Math.floor(date.getTime() / 1000)}"`
}

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;')
}
