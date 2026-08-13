import type { ReactNode } from 'react'

interface MenuBarProps {
  /** Rendu à droite de la barre : compte, déconnexion. */
  children?: ReactNode
}

/**
 * Barre de menus du Mac, fixée en haut de l'écran.
 *
 * Volontairement sans menus déroulants : les « Fichier / Édition / Présentation »
 * d'époque n'auraient rien à ouvrir ici. On garde la forme, on ne simule pas
 * des commandes inexistantes.
 */
export function MenuBar({ children }: MenuBarProps) {
  return (
    <div className="flex h-[22px] shrink-0 items-center justify-between border-b border-black bg-white px-3">
      <div className="flex items-center gap-4">
        <AppleMark />
        <span className="text-[13px] font-bold">thefavbook</span>
      </div>
      <div className="flex items-center gap-3 text-[13px]">{children}</div>
    </div>
  )
}

/** Pomme rayée du menu, dessinée en pixels plutôt qu'en emoji. */
function AppleMark() {
  return (
    <svg
      width="11"
      height="13"
      viewBox="0 0 11 13"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="currentColor"
        d="M7 0c.2 1-.3 1.9-.9 2.4-.6.5-1.4.9-2.2.8-.2-.9.3-1.9.9-2.4C5.4.3 6.3 0 7 0Zm2.6 4.5c-1 .6-1.6 1.5-1.6 2.7 0 1.3.8 2.3 1.9 2.8-.4 1-1.4 2.9-2.5 2.9-.6 0-1-.3-1.7-.3-.7 0-1.1.3-1.7.3C2.6 12.9 0 9.4 0 7.2 0 5 1.6 3.4 3.3 3.4c.7 0 1.4.4 1.9.4.4 0 1.2-.5 2.1-.4.6 0 1.7.2 2.3 1.1Z"
      />
    </svg>
  )
}
