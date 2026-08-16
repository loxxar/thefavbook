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
  label: string
  /** Rendu à la place du libellé, pour la pomme. */
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

/** Pomme du menu, en dégradé gris comme sous Leopard. */
export function AppleMark() {
  return (
    <svg width="13" height="15" viewBox="0 0 100 100" aria-label="Menu Pomme">
      <defs>
        <linearGradient id="menu-apple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f6f6f" />
          <stop offset="1" stopColor="#2f2f2f" />
        </linearGradient>
      </defs>
      <path
        fill="url(#menu-apple)"
        d="M60 18c3-6 10-9 16-8 1 7-2 13-6 17-4 5-10 8-16 7-1-7 2-12 6-16z"
      />
      <path
        fill="url(#menu-apple)"
        d="M50 30c9 0 13 5 19 5 6 0 12-5 20-4 8 1 14 6 17 13 3 8-1 20-8 29-6 8-11 12-17 12-6 0-8-4-15-4s-9 4-15 4c-6 0-12-6-17-14-9-14-11-32 1-41 6-5 12-6 15 0z"
      />
    </svg>
  )
}
