import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/*
 * Bouton System 6.
 *
 * Le bouton par défaut de l'époque porte un liseré épais : c'est lui qu'active
 * la touche Entrée. On le rend par un anneau, pas par une couleur — l'écran
 * n'en avait aucune.
 *
 * Le clic inverse la vidéo (noir et blanc permutés) plutôt que d'assombrir.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center border border-black bg-white px-4 text-[13px] whitespace-nowrap select-none outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "font-bold ring-2 ring-black ring-offset-2 active:bg-black active:text-white",
        outline: "active:bg-black active:text-white",
        secondary: "active:bg-black active:text-white",
        ghost: "border-transparent active:bg-black active:text-white",
        destructive:
          "font-bold active:bg-black active:text-white",
        link: "border-transparent px-0 underline underline-offset-2",
      },
      size: {
        default: "h-6",
        xs: "h-5 px-2",
        sm: "h-5 px-3",
        lg: "h-7 px-5",
        icon: "size-6 px-0",
        "icon-xs": "size-5 px-0",
        "icon-sm": "size-5 px-0",
        "icon-lg": "size-7 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

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
