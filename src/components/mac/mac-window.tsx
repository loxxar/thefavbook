import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MacWindowProps {
  title: string
  children: ReactNode
  /** Barre d'état en bas de fenêtre, à la Finder. */
  status?: string
  /**
   * Rend la pastille rouge active. Sans cette fonction, les trois pastilles
   * restent décoratives : un bouton qui ne ferme rien est un bouton menteur.
   */
  onClose?: () => void
  className?: string
}

/** Fenêtre Aqua : coins arrondis, chrome dégradé, ombre portée large. */
export function MacWindow({
  title,
  children,
  status,
  onClose,
  className,
}: MacWindowProps) {
  return (
    <section className={cn('aqua-window flex flex-col', className)}>
      <header className="aqua-titlebar flex h-[26px] shrink-0 items-center px-2">
        <TrafficLights onClose={onClose} />
        <h1 className="flex-1 text-center text-[13px] font-semibold text-[#454545] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
          {title}
        </h1>
        <div className="w-[54px]" />
      </header>

      {/* min-h-0 : sans lui, un enfant défilant refuse de rétrécir sous sa
          hauteur intrinsèque et déborde de la fenêtre. */}
      <div className="flex min-h-0 flex-1 flex-col bg-white p-4">
        {children}
      </div>

      {status !== undefined && (
        <div className="aqua-statusbar flex h-[22px] shrink-0 items-center px-3 text-[11px] text-[#555]">
          {status}
        </div>
      )}
    </section>
  )
}

const LIGHT =
  'size-3 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,.6),0_0_0_1px_rgba(0,0,0,.15)]'

function TrafficLights({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex gap-[6px]">
      {onClose === undefined ? (
        <span
          aria-hidden="true"
          className={`${LIGHT} bg-[radial-gradient(circle_at_30%_28%,#ff8f83,#e0483d_65%,#c8342a)]`}
        />
      ) : (
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className={`${LIGHT} bg-[radial-gradient(circle_at_30%_28%,#ff8f83,#e0483d_65%,#c8342a)]`}
        />
      )}
      <span
        aria-hidden="true"
        className={`${LIGHT} bg-[radial-gradient(circle_at_30%_28%,#ffe08a,#f0a91f_65%,#d6900a)]`}
      />
      <span
        aria-hidden="true"
        className={`${LIGHT} bg-[radial-gradient(circle_at_30%_28%,#a6e58a,#3fae2a_65%,#2c8f1c)]`}
      />
    </div>
  )
}
