'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Barre de menus Leopard, réellement fonctionnelle.
 *
 * Les menus n'existent que s'ils contiennent de vraies commandes. Reproduire
 * « Fichier / Édition / Présentation » pour la forme ferait des affordances
 * menteuses.
 */

export interface MenuItem {
  label: string
  /** Absent : l'entrée est un simple libellé, non cliquable. */
  onSelect?: () => void
  href?: string
  /** Trait de séparation au-dessus de l'entrée. */
  separatorBefore?: boolean
  disabled?: boolean
}

export interface Menu {
  /** Sert de clé et de nom accessible, même quand une icône le remplace. */
  label: string
  /** Rendu à la place du libellé. */
  icon?: ReactNode
  items: MenuItem[]
}

interface MenuBarProps {
  menus: Menu[]
  /** Affiché à droite de la barre. */
  trailing?: ReactNode
}

export function MenuBar({ menus, trailing }: MenuBarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openIndex === null) return

    function onPointerDown(event: PointerEvent) {
      if (!barRef.current?.contains(event.target as Node)) setOpenIndex(null)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenIndex(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openIndex])

  return (
    <div
      ref={barRef}
      className="aqua-menubar sticky top-0 z-50 flex h-[24px] shrink-0 items-center justify-between px-2 text-[13px] text-[#2b2b2b]"
    >
      <div className="flex items-center">
        {menus.map((menu, index) => (
          <div key={menu.label} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openIndex === index}
              // Une icône seule ne se nomme pas : sans cela, le menu des
              // langues n'aurait aucun libellé pour un lecteur d'écran.
              aria-label={menu.icon === undefined ? undefined : menu.label}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              // Une fois un menu ouvert, survoler les autres les ouvre :
              // c'est le comportement d'origine.
              onPointerEnter={() => openIndex !== null && setOpenIndex(index)}
              className={`flex h-[24px] items-center gap-1.5 px-2.5 ${
                openIndex === index
                  ? 'bg-[linear-gradient(to_bottom,var(--accent-top),var(--accent-bottom))] text-white'
                  : 'hover:bg-black/5'
              }`}
            >
              {menu.icon ?? <span className="font-semibold">{menu.label}</span>}
            </button>

            {openIndex === index && (
              <ul
                role="menu"
                className="absolute top-[24px] left-0 min-w-[220px] rounded-b-[5px] border border-[#8f8f8f] border-t-0 bg-[#f7f7f7] py-1 shadow-[0_8px_20px_rgba(0,0,0,.35)]"
              >
                {menu.items.map((item) => (
                  <li key={item.label} role="none">
                    {item.separatorBefore === true && (
                      <hr className="my-1 border-[#d9d9d9]" />
                    )}
                    <MenuEntry item={item} onDone={() => setOpenIndex(null)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pr-1">{trailing}</div>
    </div>
  )
}

function MenuEntry({ item, onDone }: { item: MenuItem; onDone: () => void }) {
  const shared =
    'block w-full px-3 py-[3px] text-left text-[13px] hover:bg-[linear-gradient(to_bottom,var(--accent-top),var(--accent-bottom))] hover:text-white'

  if (item.onSelect === undefined && item.href === undefined) {
    return (
      <span className="block px-3 py-[3px] text-[12px] text-muted-foreground">
        {item.label}
      </span>
    )
  }

  if (item.href !== undefined) {
    return (
      <a href={item.href} role="menuitem" className={shared} onClick={onDone}>
        {item.label}
      </a>
    )
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      className={`${shared} disabled:pointer-events-none disabled:opacity-40`}
      onClick={() => {
        item.onSelect?.()
        onDone()
      }}
    >
      {item.label}
    </button>
  )
}

/**
 * Marque du produit, à la place de la pomme du menu d'origine.
 *
 * `currentColor` plutôt qu'un dégradé figé : le bouton passe au blanc sur
 * fond bleu quand son menu s'ouvre, et une teinte fixe s'y effaçait. À onze
 * pixels, le dégradé ne se voyait de toute façon pas.
 *
 * Un style visuel ne s'approprie pas, un logo si : reproduire la pomme
 * d'Apple aurait été un emprunt de marque qu'aucune mention en pied de page
 * ne couvre. Un ruban de signet dit ce que fait l'outil, et lui appartient.
 *
 * Le dégradé gris reprend celui de la barre de menus Leopard, pour que la
 * substitution ne saute pas aux yeux.
 */
export function ProductMark() {
  return (
    <svg width="11" height="15" viewBox="0 0 22 30" role="presentation">
      <path
        fill="currentColor"
        d="M3 1h16a2 2 0 0 1 2 2v25a1 1 0 0 1-1.6.8L11 22.5 2.6 28.8A1 1 0 0 1 1 28V3a2 2 0 0 1 2-2Z"
      />
    </svg>
  )
}

/**
 * Globe du menu des langues.
 *
 * Dessiné plutôt qu'emprunté à un emoji : le rendu d'un emoji change d'un
 * système à l'autre, et sa couleur ne suivrait pas celle de la barre.
 *
 * Les méridiens sont deux ellipses et une ligne — assez pour lire un globe à
 * onze pixels, où tout dessin plus fin se refermerait en bouillie.
 */
export function GlobeMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 22 22" role="presentation">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8.2" />
        <ellipse cx="11" cy="11" rx="3.4" ry="8.2" />
        <path d="M3.2 8.2h15.6M3.2 13.8h15.6" />
      </g>
    </svg>
  )
}
