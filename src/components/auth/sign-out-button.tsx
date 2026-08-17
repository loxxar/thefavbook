'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { useTranslations } from '@/components/i18n/translations-provider'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'

export function SignOutButton() {
  const router = useRouter()
  const { t } = useTranslations()
  const [isPending, setIsPending] = useState(false)

  async function onSignOut(): Promise<void> {
    setIsPending(true)
    const { error } = await authClient.signOut()

    if (error) {
      toast.error(t.auth.signOutFailed)
      setIsPending(false)
      return
    }

    router.replace('/connexion')
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onSignOut}
      disabled={isPending}
    >
      {isPending ? t.auth.signingOut : t.auth.signOut}
    </Button>
  )
}
