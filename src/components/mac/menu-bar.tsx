import type { ReactNode } from 'react'

interface MenuBarProps {
  /** Rendu à droite de la barre : compte, déconnexion. */
  children?: ReactNode
}

/**
 * Barre de menus Leopard : translucide, posée sur le bureau.
 *
 * Volontairement sans menus déroulants : les « Fichier / Édition / Présentation »
 * d'époque n'auraient rien à ouvrir ici. On garde la forme, on ne simule pas
 * des commandes inexistantes.
 */
export function MenuBar({ children }: MenuBarProps) {
  return (
    <div className="aqua-menubar sticky top-0 z-50 flex h-[24px] shrink-0 items-center justify-between px-3 text-[13px] text-[#2b2b2b]">
      <div className="flex items-center gap-4">
        <AppleMark />
        <span className="font-semibold">thefavbook</span>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}

/** Pomme du menu, en dégradé gris comme sous Leopard. */
function AppleMark() {
  return (
    <svg width="13" height="15" viewBox="0 0 100 100" aria-hidden="true">
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
