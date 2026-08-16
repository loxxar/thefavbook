import * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Champ Aqua : bordure fine, légère ombre interne en haut, et halo bleu au
 * focus — l'anneau lumineux caractéristique de Mac OS X.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-[22px] w-full min-w-0 rounded-[4px] border border-[#a9a9a9] bg-white px-2 text-[12px] text-[#2b2b2b] outline-none',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,.12)] placeholder:text-[#9ca3af]',
        'focus-visible:border-[#5b9bf5] focus-visible:shadow-[inset_0_1px_2px_rgba(0,0,0,.08),0_0_0_3px_rgba(91,155,245,.45)]',
        'disabled:pointer-events-none disabled:bg-[#f0f0f0] disabled:opacity-60',
        'aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_rgba(200,52,42,.35)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
