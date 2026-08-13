interface FieldErrorProps {
  children: string
}

/**
 * Message d'erreur en vidéo inverse.
 *
 * POURQUOI pas de rouge : l'écran d'époque est 1 bit. L'inversion noir/blanc
 * était le seul moyen d'attirer l'œil, et elle reste parfaitement lisible —
 * contrairement à une couleur, elle ne dépend pas de la perception des teintes.
 */
export function FieldError({ children }: FieldErrorProps) {
  return (
    <p className="inline-block bg-black px-1 text-[12px] text-white">
      {children}
    </p>
  )
}
