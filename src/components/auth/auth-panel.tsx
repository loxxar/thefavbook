'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CreateAccountForm } from '@/components/auth/create-account-form'
import { SignInForm } from '@/components/auth/sign-in-form'
import { Button } from '@/components/ui/button'

/** L'instance est ouverte : on choisit entre créer un compte et se connecter. */
export function AuthPanel() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        {mode === 'signIn'
          ? 'Accédez à vos favoris.'
          : 'Vos favoris restent les vôtres : rien n’est partagé, rien n’est envoyé ailleurs sans votre accord.'}
      </p>

      {mode === 'signIn' ? <SignInForm /> : <CreateAccountForm />}

      <div className="flex items-center justify-between border-t border-[#d9d9d9] pt-3">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        >
          {mode === 'signIn' ? 'Créer un compte' : 'J’ai déjà un compte'}
        </Button>

        <Link
          href="/confidentialite"
          className="text-[11px] text-muted-foreground underline underline-offset-2"
        >
          Que devient ce que j’envoie ?
        </Link>
      </div>
    </div>
  )
}
