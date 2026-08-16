'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { ImportForm } from '@/components/bookmarks/import-form'
import { shouldAskForTip, TipDialog } from '@/components/bookmarks/tip-dialog'
import { MenuBar, ProductMark, type Menu } from '@/components/mac/menu-bar'
import { MacWindow } from '@/components/mac/mac-window'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'
import { createFolderAction } from '@/lib/bookmarks/folder-actions'
import {
  createSpaceAction,
  deleteSpaceAction,
  renameSpaceAction,
} from '@/lib/spaces/actions'
import type { SpaceSummary } from '@/lib/spaces/current'
import { deleteAccountAction } from '@/lib/auth/account-actions'

interface DashboardShellProps {
  email: string
  bookmarkCount: number
  folderCount: number
  supporterCount: number
  spaces: SpaceSummary[]
  currentSpaceId: string
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
  spaces,
  currentSpaceId,
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
    link.href = `/api/export?espace=${encodeURIComponent(currentSpaceId)}`
    link.download = ''
    document.body.append(link)
    link.click()
    link.remove()

    // La demande de soutien vient après le départ du téléchargement.
    if (shouldAskForTip()) setTimeout(() => setIsTipping(true), 1200)
  }

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  async function runSpace(kind: 'create' | 'rename' | 'delete') {
    if (kind === 'delete') {
      const label = currentSpace?.name ?? 'cet espace'
      const count = currentSpace?.bookmarkCount ?? 0
      const confirmed = confirm(
        `Supprimer « ${label} » et ses ${count} favoris ? Cette action est irréversible.`,
      )

      if (!confirmed) return

      const result = await deleteSpaceAction(currentSpaceId)

      if (result.ok) {
        router.replace('/')
        router.refresh()
        toast.success('Espace supprimé.')
      } else {
        toast.error(result.message)
      }
      return
    }

    const name = prompt(
      kind === 'create' ? 'Nom du nouvel espace' : "Nouveau nom de l'espace",
      kind === 'rename' ? (currentSpace?.name ?? '') : '',
    )

    if (name === null || name.trim() === '') return

    const result =
      kind === 'create'
        ? await createSpaceAction(name)
        : await renameSpaceAction(currentSpaceId, name)

    if (result.ok) {
      router.refresh()
      toast.success(kind === 'create' ? 'Espace créé.' : 'Espace renommé.')
    } else {
      toast.error(result.message)
    }
  }

  const menus: Menu[] = [
    {
      label: 'thefavbook',
      icon: <ProductMark />,
      items: [
        { label: 'Accueil', href: '/' },
        {
          label: 'Confidentialité',
          href: '/confidentialite',
          separatorBefore: true,
        },
        {
          label: 'Code source',
          href: 'https://github.com/loxxar/thefavbook',
        },
      ],
    },
    {
      label: 'Fichier',
      items: [
        {
          label: 'Importer des favoris…',
          onSelect: () => setIsImporting(true),
        },
        {
          label: 'Exporter en HTML',
          onSelect: exportBookmarks,
          disabled: !hasBookmarks,
        },
        {
          label: 'Nouveau dossier à la racine…',
          separatorBefore: true,
          onSelect: async () => {
            const name = prompt('Nom du dossier')

            if (name === null || name.trim() === '') return

            const result = await createFolderAction(name, null, currentSpaceId)

            if (result.ok) {
              router.refresh()
              toast.success('Dossier créé.')
            } else {
              toast.error(result.message)
            }
          },
        },
      ],
    },
    {
      label: 'Espaces',
      items: [
        ...spaces.map((space) => ({
          // Passer par l'adresse plutôt que par un état client garde deux
          // onglets indépendants et rend le lien partageable.
          label: `${space.id === currentSpaceId ? '• ' : '   '}${space.name} (${space.bookmarkCount})`,
          href: `/?espace=${encodeURIComponent(space.id)}`,
        })),
        {
          label: 'Nouvel espace…',
          separatorBefore: true,
          onSelect: () => void runSpace('create'),
        },
        {
          label: 'Renommer cet espace…',
          onSelect: () => void runSpace('rename'),
        },
        {
          label: 'Supprimer cet espace…',
          onSelect: () => void runSpace('delete'),
          disabled: spaces.length <= 1,
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
            {currentSpace?.name ?? 'Favoris'} · {bookmarkCount} favoris ·{' '}
            {folderCount} dossiers
          </span>
        }
      />

      {children}

      {isImporting && (
        <Modal
          title="Importer des favoris"
          onClose={() => setIsImporting(false)}
        >
          <ImportForm spaceId={currentSpaceId} />
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
