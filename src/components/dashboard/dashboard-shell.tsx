'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { ImportForm } from '@/components/bookmarks/import-form'
import { shouldAskForTip, TipDialog } from '@/components/bookmarks/tip-dialog'
import { AppleMark, MenuBar, type Menu } from '@/components/mac/menu-bar'
import { MacWindow } from '@/components/mac/mac-window'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'
import { deleteAccountAction } from '@/lib/auth/account-actions'

interface DashboardShellProps {
  email: string
  bookmarkCount: number
  folderCount: number
  supporterCount: number
  children: ReactNode
}

/**
 * Chrome du tableau de bord : barre de menus et fenêtres modales.
 *
 * Les commandes vivent ici plutôt que dispersées dans les blocs. L'import et
 * l'export ne sont pas des réglages d'un panneau, ce sont des actions sur le
 * document — leur place est dans le menu Fichier, comme sur le système imité.
 */
export function DashboardShell({
  email,
  bookmarkCount,
  folderCount,
  supporterCount,
  children,
}: DashboardShellProps) {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const [isTipping, setIsTipping] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const hasBookmarks = bookmarkCount > 0

  function exportBookmarks() {
    // Un lien synthétique plutôt qu'une navigation : l'attribut `download`
    // garde son sens, et la page ne bouge pas.
    const link = document.createElement('a')
    link.href = '/api/export'
    link.download = ''
    document.body.append(link)
    link.click()
    link.remove()

    // La demande de soutien vient après le départ du téléchargement.
    if (shouldAskForTip()) setTimeout(() => setIsTipping(true), 1200)
  }

  const menus: Menu[] = [
    {
      label: 'Pomme',
      icon: <AppleMark />,
      items: [
        { label: 'thefavbook', href: '/' },
        { label: 'Confidentialité', href: '/confidentialite', separatorBefore: true },
        {
          label: 'Code source',
          href: 'https://github.com/loxxar/thefavbook',
        },
      ],
    },
    {
      label: 'Fichier',
      items: [
        { label: 'Importer des favoris…', onSelect: () => setIsImporting(true) },
        {
          label: 'Exporter en HTML',
          onSelect: exportBookmarks,
          disabled: !hasBookmarks,
        },
      ],
    },
    {
      label: 'Compte',
      items: [
        { label: email },
        {
          label: 'Se déconnecter',
          separatorBefore: true,
          onSelect: async () => {
            await authClient.signOut()
            router.replace('/connexion')
            router.refresh()
          },
        },
        {
          label: 'Supprimer mon compte…',
          onSelect: () => setIsConfirmingDelete(true),
        },
      ],
    },
  ]

  return (
    <div className="aqua-desktop flex h-dvh flex-col">
      <MenuBar
        menus={menus}
        trailing={
          <span className="hidden text-[12px] sm:inline">
            {bookmarkCount} favoris · {folderCount} dossiers
          </span>
        }
      />

      {children}

      {isImporting && (
        <Modal title="Importer des favoris" onClose={() => setIsImporting(false)}>
          <ImportForm />
        </Modal>
      )}

      {isConfirmingDelete && (
        <Modal
          title="Supprimer le compte"
          onClose={() => setIsConfirmingDelete(false)}
        >
          <div className="space-y-3 text-[12px]">
            <p>
              Cette action efface définitivement votre compte, vos{' '}
              {bookmarkCount} favoris et vos {folderCount} dossiers. Elle est
              irréversible.
            </p>
            <p className="text-muted-foreground">
              Pensez à exporter vos favoris avant, si vous voulez les garder.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await deleteAccountAction()
                  toast.success('Compte supprimé.')
                }}
              >
                Tout supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isTipping && (
        <TipDialog
          bookmarkCount={bookmarkCount}
          folderCount={folderCount}
          supporterCount={supporterCount}
          onClose={() => setIsTipping(false)}
        />
      )}
    </div>
  )
}

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px]"
        onClick={(event) => event.stopPropagation()}
      >
        <MacWindow title={title} onClose={onClose}>
          {children}
        </MacWindow>
      </div>
    </div>
  )
}
