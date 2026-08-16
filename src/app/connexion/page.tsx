import type { Metadata } from 'next'

import { AuthPanel } from '@/components/auth/auth-panel'
import { LegalNotice } from '@/components/legal-notice'
import { MacWindow } from '@/components/mac/mac-window'

export const metadata: Metadata = {
  title: 'Connexion — thefavbook',
}

export default function ConnexionPage() {
  return (
    <div className="aqua-desktop flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <MacWindow title="thefavbook" className="w-full max-w-[340px]">
        <AuthPanel />
      </MacWindow>
      <LegalNotice className="max-w-[340px] text-center text-white/70" />
    </div>
  )
}
