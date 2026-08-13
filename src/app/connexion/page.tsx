import type { Metadata } from 'next'

import { CreateAccountForm } from '@/components/auth/create-account-form'
import { SignInForm } from '@/components/auth/sign-in-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { accountExists } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Connexion — thefavbook',
}

/**
 * POURQUOI force-dynamic : la page interroge la base pour savoir si un compte
 * existe, sans passer par aucune API de requête. Next la prérendrait donc à la
 * compilation, et elle continuerait d'afficher le formulaire de création après
 * que le compte a été créé.
 *
 * FIXME si Cache Components est un jour activé : `dynamic` disparaît en Next 16
 * dans ce mode, il faudra basculer sur `connection()` ou un `use cache` négatif.
 */
export const dynamic = 'force-dynamic'

/**
 * Écran unique : tant qu'aucun compte n'existe, il propose la création ; une
 * fois le compte créé, il ne propose plus que la connexion.
 */
export default async function ConnexionPage() {
  const hasAccount = await accountExists()

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {hasAccount ? 'Connexion' : 'Créer votre compte'}
          </CardTitle>
          <CardDescription>
            {hasAccount
              ? 'Accédez à vos favoris.'
              : "Cette instance n'accepte qu'un seul compte. C'est le vôtre."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasAccount ? <SignInForm /> : <CreateAccountForm />}
        </CardContent>
      </Card>
    </div>
  )
}
