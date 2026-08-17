import type { ButtonHTMLAttributes, ReactNode } from 'react'

import type { RowHealth } from '@/lib/bookmarks/rows'
import { cn } from '@/lib/utils'

/**
 * Vocabulaire visuel d'Aqua : bouton bulle, bille d'état, tube de verre.
 *
 * Les dégradés vivent dans `globals.css` — ils sont trop longs pour tenir en
 * classes utilitaires, et les regrouper permet de les relire comme un
 * matériau plutôt que comme une suite de valeurs.
 */

interface AquaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'default' | 'primary' | 'danger'
}

export function AquaButton({
  tone = 'default',
  className,
  children,
  ...rest
}: AquaButtonProps) {
  return (
    <button
      type="button"
      data-tone={tone}
      className={cn(
        'aqua-bubble relative z-0 px-3 py-[3px] text-[11px] leading-[16px] font-medium',
        'disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {/* Au-dessus du reflet, que le pseudo-élément pose en absolu. */}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

const HEALTH_TONE: Record<RowHealth, string> = {
  ok: 'ok',
  dead: 'dead',
  unknown: 'unknown',
  idle: 'idle',
}

/**
 * La couleur ne porte jamais seule l'information : `label` alimente le texte
 * accessible, et la colonne voisine affiche le code en clair.
 */
export function StatusSphere({
  health,
  label,
}: {
  health: RowHealth
  label: string
}) {
  return (
    <span
      className="aqua-sphere shrink-0"
      data-tone={HEALTH_TONE[health]}
      role="img"
      aria-label={label}
      title={label}
    />
  )
}

/** Jauge déterminée : le liquide occupe la fraction connue du tube. */
export function AquaTube({
  percent,
  label,
}: {
  percent: number
  label: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div
      className="aqua-tube"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="aqua-tube-fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function AquaBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'dead' | 'warn'
}) {
  return (
    <span
      className="aqua-badge px-[6px] py-[1px] text-[10px] leading-[13px] font-bold tabular-nums"
      data-tone={tone}
    >
      {children}
    </span>
  )
}
