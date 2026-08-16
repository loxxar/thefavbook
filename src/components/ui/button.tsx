import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

/*
 * Bouton Aqua.
 *
 * Deux formes seulement à l'époque : le bouton par défaut, bleu lustré, qui
 * répond à la touche Entrée, et le bouton blanc pour tout le reste. Le clic
 * inverse le sens du dégradé — c'est ce qui donnait l'effet d'enfoncement.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[14px] border text-[12px] whitespace-nowrap select-none outline-none transition-[background] focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          'border-[#1a4fae] bg-[linear-gradient(to_bottom,#8fc0ff,#4a8ae8_48%,#2f6fd8_52%,#1c5fd6)] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_1px_2px_rgba(0,0,0,.25)] active:bg-[linear-gradient(to_bottom,#1c5fd6,#2f6fd8_48%,#4a8ae8_52%,#8fc0ff)]',
        outline:
          'border-[#9a9a9a] bg-[linear-gradient(to_bottom,#ffffff,#e3e3e3)] text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_1px_2px_rgba(0,0,0,.15)] active:bg-[linear-gradient(to_bottom,#dcdcdc,#f2f2f2)]',
        secondary:
          'border-[#9a9a9a] bg-[linear-gradient(to_bottom,#ffffff,#e3e3e3)] text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_1px_2px_rgba(0,0,0,.15)] active:bg-[linear-gradient(to_bottom,#dcdcdc,#f2f2f2)]',
        ghost:
          'border-transparent text-[#333] hover:bg-black/5 active:bg-black/10',
        destructive:
          'border-[#9a2a22] bg-[linear-gradient(to_bottom,#f08a80,#d6483c_48%,#c8342a_52%,#a72a22)] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_1px_2px_rgba(0,0,0,.25)]',
        link: 'border-transparent px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[22px] px-4',
        xs: 'h-5 px-2.5 text-[11px]',
        sm: 'h-5 px-3 text-[11px]',
        lg: 'h-[26px] px-5 text-[13px]',
        icon: 'size-[22px] px-0',
        'icon-xs': 'size-5 px-0',
        'icon-sm': 'size-5 px-0',
        'icon-lg': 'size-[26px] px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
