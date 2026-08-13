import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Champ de saisie System 6 : rectangle d'un pixel, sans arrondi ni ombre.
 * Le champ invalide est signalé par un liseré doublé, faute de rouge.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-6 w-full min-w-0 border border-black bg-white px-1.5 text-[13px] outline-none",
        "focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:ring-1 aria-invalid:ring-black aria-invalid:ring-offset-1",
        className
      )}
      {...props}
    />
  )
}

export { Input }
