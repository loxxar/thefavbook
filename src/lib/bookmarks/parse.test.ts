import { describe, expect, it } from 'vitest'

import { exportNetscapeBookmarks } from './export'
import { parseNetscapeBookmarks, parseNetscapeDate } from './parse'
import { countBookmarks, isBookmark, isFolder, type ParsedNode } from './types'

/** Export Chrome : dossiers imbriqués, favicon inline, entités HTML. */
const CHROME_EXPORT = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1609459200" LAST_MODIFIED="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Barre de favoris</H3>
    <DL><p>
        <DT><A HREF="https://github.com/" ADD_DATE="1609459200" ICON="data:image/png;base64,iVBORw0KGgo=">GitHub</A>
        <DT><H3 ADD_DATE="1612137600">Dev</H3>
        <DL><p>
            <DT><A HREF="https://developer.mozilla.org/fr/docs/Web/JavaScript" ADD_DATE="1612137600">JavaScript | MDN</A>
            <DT><A HREF="https://react.dev/?utm_source=news&amp;utm_medium=email" ADD_DATE="1612224000">React</A>
        </DL><p>
        <DT><A HREF="https://news.ycombinator.com" ADD_DATE="1609545600">Hacker News</A>
    </DL><p>
    <DT><A HREF="https://example.com/page/" ADD_DATE="1620000000">Titre &amp; &lt;balises&gt;</A>
</DL><p>
`

/** Export Firefox : descriptions <DD> non fermées et attribut TAGS. */
const FIREFOX_EXPORT = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>
<DL><p>
    <DT><H3 ADD_DATE="1650000000">Langages</H3>
    <DL><p>
        <DT><A HREF="https://www.rust-lang.org/" ADD_DATE="1650000000" TAGS="rust,systems,rust">Rust</A>
        <DD>Langage système sans garbage collector
        <DT><A HREF="https://go.dev/" ADD_DATE="1650000001">Go</A>
    </DL><p>
</DL><p>
`

describe('parseNetscapeBookmarks', () => {
  it('should preserve folder nesting when folders are nested three levels deep', () => {
    const tree = parseNetscapeBookmarks(CHROME_EXPORT)

    expect(tree).toHaveLength(2)

    const toolbar = tree[0]
    if (!isFolder(toolbar)) throw new Error('le premier nœud doit être un dossier')
    expect(toolbar.title).toBe('Barre de favoris')
    expect(toolbar.isToolbar).toBe(true)
    expect(toolbar.children).toHaveLength(3)

    const dev = toolbar.children[1]
    if (!isFolder(dev)) throw new Error('le second enfant doit être le dossier Dev')
    expect(dev.title).toBe('Dev')
    expect(dev.children.map((child) => child.title)).toEqual([
      'JavaScript | MDN',
      'React',
    ])

    // Le favori qui suit le </DL> imbriqué doit revenir dans le dossier parent,
    // pas rester coincé dans le sous-dossier : c'est le cœur du parsing.
    const hackerNews = toolbar.children[2]
    expect(hackerNews.title).toBe('Hacker News')

    expect(countBookmarks(tree)).toBe(5)
  })

  it('should decode HTML entities when titles contain escaped characters', () => {
    const tree = parseNetscapeBookmarks(CHROME_EXPORT)
    const orphan = tree[1]

    expect(orphan.title).toBe('Titre & <balises>')
  })

  it('should keep the original URL untouched when it carries tracking parameters', () => {
    const tree = parseNetscapeBookmarks(CHROME_EXPORT)
    const toolbar = tree[0]
    if (!isFolder(toolbar)) throw new Error('dossier attendu')
    const dev = toolbar.children[1]
    if (!isFolder(dev)) throw new Error('dossier attendu')

    expect(dev.children[1].kind === 'bookmark' && dev.children[1].url).toBe(
      'https://react.dev/?utm_source=news&utm_medium=email',
    )
  })

  it('should read the icon attribute when the browser inlines a favicon', () => {
    const tree = parseNetscapeBookmarks(CHROME_EXPORT)
    const toolbar = tree[0]
    if (!isFolder(toolbar)) throw new Error('dossier attendu')
    const github = toolbar.children[0]

    expect(isBookmark(github) && github.iconDataUri).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    )
  })

  it('should attach the description when a DD block follows an unclosed DT', () => {
    const tree = parseNetscapeBookmarks(FIREFOX_EXPORT)
    const folder = tree[0]
    if (!isFolder(folder)) throw new Error('dossier attendu')

    const rust = folder.children[0]
    if (!isBookmark(rust)) throw new Error('favori attendu')
    expect(rust.description).toBe('Langage système sans garbage collector')

    // La description ne doit pas déborder sur le favori suivant.
    const go = folder.children[1]
    if (!isBookmark(go)) throw new Error('favori attendu')
    expect(go.description).toBeNull()
  })

  it('should deduplicate tags when the TAGS attribute repeats a value', () => {
    const tree = parseNetscapeBookmarks(FIREFOX_EXPORT)
    const folder = tree[0]
    if (!isFolder(folder)) throw new Error('dossier attendu')
    const rust = folder.children[0]

    expect(isBookmark(rust) && rust.tags).toEqual(['rust', 'systems'])
  })

  it('should return an empty tree when the file contains no bookmarks', () => {
    expect(parseNetscapeBookmarks('')).toEqual([])
    expect(parseNetscapeBookmarks('<html><body>rien ici</body></html>')).toEqual([])
  })

  it('should skip anchors when the HREF attribute is missing or blank', () => {
    const html = `<DL><p>
      <DT><A ADD_DATE="1609459200">Sans href</A>
      <DT><A HREF="   ">Href vide</A>
      <DT><A HREF="https://ok.example">Valide</A>
    </DL><p>`

    const tree = parseNetscapeBookmarks(html)
    expect(tree).toHaveLength(1)
    expect(tree[0].title).toBe('Valide')
  })

  it('should keep the hierarchy intact when a folder has no closing DL', () => {
    const html = `<DL><p>
      <DT><H3>Cassé</H3>
      <DL><p>
        <DT><A HREF="https://a.example">A</A>
    </DL><p>`

    const tree = parseNetscapeBookmarks(html)
    expect(countBookmarks(tree)).toBe(1)
  })

  it('should preserve an empty folder when no DL follows its H3', () => {
    const html = `<DL><p>
      <DT><H3>Vide</H3>
      <DT><A HREF="https://a.example">A</A>
    </DL><p>`

    const tree = parseNetscapeBookmarks(html)
    expect(tree.map((node) => node.title)).toEqual(['Vide', 'A'])
    expect(isFolder(tree[0]) && tree[0].children).toEqual([])
  })
})

describe('parseNetscapeDate', () => {
  it('should read seconds when the value uses the documented Netscape unit', () => {
    expect(parseNetscapeDate('1609459200')?.toISOString()).toBe(
      '2021-01-01T00:00:00.000Z',
    )
  })

  it('should read milliseconds when the export uses that unit', () => {
    expect(parseNetscapeDate('1609459200000')?.toISOString()).toBe(
      '2021-01-01T00:00:00.000Z',
    )
  })

  it('should read microseconds when the export comes from Safari', () => {
    expect(parseNetscapeDate('1609459200000000')?.toISOString()).toBe(
      '2021-01-01T00:00:00.000Z',
    )
  })

  it('should return null when the value is absent, zero or not a number', () => {
    expect(parseNetscapeDate(undefined)).toBeNull()
    expect(parseNetscapeDate('0')).toBeNull()
    expect(parseNetscapeDate('')).toBeNull()
    expect(parseNetscapeDate('hier')).toBeNull()
  })

  it('should return null when the timestamp falls outside a plausible range', () => {
    expect(parseNetscapeDate('1')).toBeNull()
  })
})

describe('round-trip import → export', () => {
  /**
   * Le test qui protège tout le reste : si l'export ne restitue pas exactement
   * ce que l'import a lu, l'application perd des données utilisateur.
   */
  const roundTrip = (html: string): [ParsedNode[], ParsedNode[]] => {
    const first = parseNetscapeBookmarks(html)
    const second = parseNetscapeBookmarks(
      exportNetscapeBookmarks(first, { includeIcons: true }),
    )
    return [first, second]
  }

  it('should produce an identical tree when a Chrome export is re-imported', () => {
    const [first, second] = roundTrip(CHROME_EXPORT)
    expect(second).toEqual(first)
  })

  it('should produce an identical tree when a Firefox export is re-imported', () => {
    const [first, second] = roundTrip(FIREFOX_EXPORT)
    expect(second).toEqual(first)
  })

  it('should survive a second export when the tree is exported twice', () => {
    const once = exportNetscapeBookmarks(parseNetscapeBookmarks(CHROME_EXPORT), {
      includeIcons: true,
    })
    const twice = exportNetscapeBookmarks(parseNetscapeBookmarks(once), {
      includeIcons: true,
    })

    expect(twice).toBe(once)
  })

  it('should drop inline icons when includeIcons is left at its default', () => {
    const output = exportNetscapeBookmarks(parseNetscapeBookmarks(CHROME_EXPORT))
    expect(output).not.toContain('ICON=')
  })

  it('should re-escape special characters when a title contains markup', () => {
    const tree = parseNetscapeBookmarks(
      '<DL><p><DT><A HREF="https://a.example/?a=1&amp;b=2">A &lt;b&gt; &amp; C</A></DL><p>',
    )
    const output = exportNetscapeBookmarks(tree)

    expect(output).toContain('HREF="https://a.example/?a=1&amp;b=2"')
    expect(output).toContain('>A &lt;b&gt; &amp; C</A>')
    expect(parseNetscapeBookmarks(output)).toEqual(tree)
  })
})
