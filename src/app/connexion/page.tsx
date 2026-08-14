import type { Metadata } from 'next'

import { AuthPanel } from '@/components/auth/auth-panel'
import { MacWindow } from '@/components/mac/mac-window'

export const metadata: Metadata = {
  title: 'Connexion — thefavbook',
}

export default function ConnexionPage() {
  return (
    <div className="aqua-desktop flex flex-1 items-center justify-center p-4">
      <MacWindow title="thefavbook" className="w-full max-w-[340px]">
        <AuthPanel />
      </MacWindow>
    </div>
  )
}
