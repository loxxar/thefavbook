interface FieldErrorProps {
  children: string
}

/** Message d'erreur sous un champ. */
export function FieldError({ children }: FieldErrorProps) {
  return (
    <p className="text-[11px] text-destructive" role="alert">
      {children}
    </p>
  )
}
