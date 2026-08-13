import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MacWindowProps {
  title: string
  children: ReactNode
  /** Barre d'état en bas de fenêtre, à la Finder. */
  status?: string
  className?: string
}

/**
 * Fenêtre Aqua : coins arrondis, chrome dégradé, ombre portée large.
 *
 * Les trois pastilles sont décoratives et marquées `aria-hidden` : elles font
 * partie du décor de fenêtre, pas de l'interface. Rien n'invite à cliquer —
 * ni curseur, ni survol.
 */
export function MacWindow({
  title,
  children,
  status,
  className,
}: MacWindowProps) {
  return (
    <section className={cn('aqua-window flex flex-col', className)}>
      <header className="aqua-titlebar flex h-[26px] shrink-0 items-center px-2">
        <TrafficLights />
        <h1 className="flex-1 text-center text-[13px] font-semibold text-[#454545] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
          {title}
        </h1>
        <div className="w-[54px]" />
      </header>

      <div className="bg-white p-5">{children}</div>

      {status !== undefined && (
        <div className="aqua-statusbar flex h-[22px] shrink-0 items-center px-3 text-[11px] text-[#555]">
          {status}
        </div>
      )}
    </section>
  )
}

function TrafficLights() {
  return (
    <div className="flex gap-[6px]" aria-hidden="true">
      <span className="size-3 rounded-full bg-[radial-gradient(circle_at_30%_28%,#ff8f83,#e0483d_65%,#c8342a)] shadow-[inset_0_1px_1px_rgba(255,255,255,.6),0_0_0_1px_rgba(0,0,0,.15)]" />
      <span className="size-3 rounded-full bg-[radial-gradient(circle_at_30%_28%,#ffe08a,#f0a91f_65%,#d6900a)] shadow-[inset_0_1px_1px_rgba(255,255,255,.6),0_0_0_1px_rgba(0,0,0,.15)]" />
      <span className="size-3 rounded-full bg-[radial-gradient(circle_at_30%_28%,#a6e58a,#3fae2a_65%,#2c8f1c)] shadow-[inset_0_1px_1px_rgba(255,255,255,.6),0_0_0_1px_rgba(0,0,0,.15)]" />
    </div>
  )
}
