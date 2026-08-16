import { Parser } from 'htmlparser2'

import type { ParsedBookmark, ParsedFolder, ParsedNode } from './types'

/**
 * Parseur du Netscape Bookmark File Format, le format d'export commun à
 * Chrome, Firefox, Safari, Edge, Brave, Opera et Vivaldi.
 *
 * POURQUOI un parcours événementiel plutôt qu'un arbre DOM : dans ce format,
 * <DT>, <DD> et <p> ne sont jamais fermés. Chaque parseur HTML « répare » cet
 * arbre à sa façon, et la structure obtenue devient non fiable. En revanche
 * <DL> et </DL> sont toujours appariés et délimitent exactement les dossiers.
 * On suit donc une pile de <DL> et on ignore la hiérarchie reconstruite.
 */
export function parseNetscapeBookmarks(html: string): ParsedNode[] {
  const root: ParsedFolder = {
    kind: 'folder',
    title: '',
    addDate: null,
    lastModified: null,
    isToolbar: false,
    children: [],
  }

  /** Pile des dossiers ouverts ; le sommet reçoit les nœuds rencontrés. */
  const stack: ParsedFolder[] = [root]
  /** Dossier vu via <H3> mais dont le <DL> n'est pas encore ouvert. */
  let pendingFolder: ParsedFolder | null = null
  /** Favori en cours de lecture, entre <A> et </A>. */
  let openBookmark: ParsedBookmark | null = null
  /** Dernier favori inséré, cible d'un éventuel <DD> de description. */
  let lastBookmark: ParsedBookmark | null = null

  let capture: 'h3' | 'a' | 'dd' | null = null
  let buffer = ''

  const top = (): ParsedFolder => stack[stack.length - 1]

  /** Un <H3> sans <DL> derrière : dossier vide, on le conserve quand même. */
  const flushPendingFolder = (): void => {
    if (!pendingFolder) return
    top().children.push(pendingFolder)
    pendingFolder = null
  }

  const flushDescription = (): void => {
    if (capture !== 'dd') return
    const text = normalizeText(buffer)
    if (text !== '' && lastBookmark) lastBookmark.description = text
    capture = null
    buffer = ''
  }

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        switch (name) {
          case 'h3': {
            flushDescription()
            flushPendingFolder()
            pendingFolder = {
              kind: 'folder',
              title: '',
              addDate: parseNetscapeDate(attribs.add_date),
              lastModified: parseNetscapeDate(attribs.last_modified),
              isToolbar: attribs.personal_toolbar_folder === 'true',
              children: [],
            }
            capture = 'h3'
            buffer = ''
            break
          }

          case 'dl': {
            flushDescription()
            if (pendingFolder) {
              top().children.push(pendingFolder)
              stack.push(pendingFolder)
              pendingFolder = null
            } else {
              // <DL> racine, ou <DL> orphelin dans un export abîmé : on empile
              // le dossier courant pour que le </DL> correspondant dépile
              // sans décaler toute la hiérarchie qui suit.
              stack.push(top())
            }
            break
          }

          case 'a': {
            flushDescription()
            // Un <A> après un <H3> sans <DL> : le dossier est vide et doit être
            // inséré avant ce favori, sinon l'ordre des nœuds est faux.
            flushPendingFolder()
            const href = attribs.href
            if (href === undefined || href.trim() === '') break
            openBookmark = {
              kind: 'bookmark',
              title: '',
              url: href.trim(),
              addDate: parseNetscapeDate(attribs.add_date),
              lastModified: parseNetscapeDate(attribs.last_modified),
              description: null,
              iconDataUri: attribs.icon ?? null,
              iconUrl: attribs.icon_uri ?? null,
              tags: parseTags(attribs.tags),
            }
            capture = 'a'
            buffer = ''
            break
          }

          case 'dd': {
            capture = 'dd'
            buffer = ''
            break
          }

          case 'dt': {
            flushDescription()
            flushPendingFolder()
            break
          }
        }
      },

      ontext(text) {
        if (capture !== null) buffer += text
      },

      onclosetag(name) {
        switch (name) {
          case 'h3': {
            if (pendingFolder) pendingFolder.title = normalizeText(buffer)
            capture = null
            buffer = ''
            break
          }

          case 'a': {
            if (openBookmark) {
              openBookmark.title = normalizeText(buffer)
              top().children.push(openBookmark)
              lastBookmark = openBookmark
              openBookmark = null
            }
            capture = null
            buffer = ''
            break
          }

          case 'dd': {
            flushDescription()
            break
          }

          case 'dl': {
            flushDescription()
            flushPendingFolder()
            if (stack.length > 1) stack.pop()
            break
          }
        }
      },
    },
    {
      decodeEntities: true,
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
    },
  )

  parser.write(html)
  parser.end()

  flushDescription()
  flushPendingFolder()

  return root.children
}

/**
 * ADD_DATE / LAST_MODIFIED sont documentés en secondes Unix, mais certains
 * exports utilisent des millisecondes et Safari des microsecondes. On tranche
 * sur l'ordre de grandeur plutôt que sur le navigateur, qu'on ne connaît pas.
 */
export function parseNetscapeDate(value: string | undefined): Date | null {
  if (value === undefined) return null
  const numeric = Number(value.trim())
  if (!Number.isFinite(numeric) || numeric <= 0) return null

  const milliseconds =
    numeric > 1e15 ? numeric / 1000 : numeric > 1e12 ? numeric : numeric * 1000

  const date = new Date(milliseconds)
  if (Number.isNaN(date.getTime())) return null
  // Une date hors de cette plage vient d'un champ corrompu, pas d'un favori.
  if (date.getUTCFullYear() < 1990 || date.getUTCFullYear() > 2100) return null
  return date
}

function parseTags(value: string | undefined): string[] {
  if (value === undefined) return []
  return [
    ...new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ''),
    ),
  ]
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
