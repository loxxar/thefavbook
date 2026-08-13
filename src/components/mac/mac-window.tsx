import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MacWindowProps {
  title: string
  children: ReactNode
  className?: string
}

/**
 * Fenêtre System 6 : bordure d'un pixel, barre de titre rayée, titre centré
 * sur fond blanc qui « perce » les rayures.
 *
 * Pas de case de fermeture : elle ne fermerait rien. Un bouton inerte reste un
 * bouton menteur, quelle que soit l'époque qu'on imite.
 */
export function MacWindow({ title, children, className }: MacWindowProps) {
  return (
    <section className={cn('border border-black bg-white', className)}>
      <header className="mac-title-stripes flex h-5 items-center justify-center border-b border-black px-2">
        <h1 className="bg-white px-2 text-[13px] font-bold">{title}</h1>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
