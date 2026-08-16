import { z } from 'zod'

/**
 * Schémas partagés client/serveur.
 *
 * `PASSWORD_MIN_LENGTH` est la source unique : `auth/server.ts` la passe à
 * better-auth, les formulaires la valident. Deux valeurs divergentes
 * produiraient un formulaire qui accepte ce que le serveur refuse.
 */
export const PASSWORD_MIN_LENGTH = 12

export const signInSchema = z.object({
  email: z.email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
})

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis.'),
  email: z.email('Adresse e-mail invalide.'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Au moins ${PASSWORD_MIN_LENGTH} caractères.`),
})

export type SignInInput = z.infer<typeof signInSchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
