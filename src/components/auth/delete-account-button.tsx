'use client'

import { useState, useTransition } from 'react'

import { deleteAccountAction } from '@/lib/auth/account-actions'
import { Button } from '@/components/ui/button'

/**
 * Suppression du compte, avec confirmation explicite.
 *
 * Deux clics et un texte sans ambiguïté : l'action est irréversible et
 * emporte tous les favoris. Une boîte de dialogue native serait ignorée par
 * réflexe.
 */
export function DeleteAccountButton() {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => setIsConfirming(true)}
      >
        Supprimer mon compte
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span>Supprimer définitivement le compte et tous les favoris ?</span>
      <Button
        type="button"
        variant="destructive"
        size="xs"
        disabled={isPending}
        onClick={() => startTransition(() => deleteAccountAction())}
      >
        {isPending ? 'Suppression…' : 'Oui, tout supprimer'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => setIsConfirming(false)}
      >
        Annuler
      </Button>
    </div>
  )
}
