import { SignOutButton } from '@/components/auth/sign-out-button'
import { BookmarkTree } from '@/components/bookmarks/bookmark-tree'
import { ImportForm } from '@/components/bookmarks/import-form'
import { MacWindow } from '@/components/mac/mac-window'
import { MenuBar } from '@/components/mac/menu-bar'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth/session'
import { readBookmarkTree } from '@/lib/bookmarks/tree'
import { countBookmarks } from '@/lib/bookmarks/types'
import { getPrisma } from '@/lib/db'

export default async function HomePage() {
  const user = await requireUser()
  const prisma = getPrisma()

  // Chaque requête filtre sur userId — c'est la seule barrière, voir
  // CONVENTIONS.md.
  const [nodes, folderCount] = await Promise.all([
    readBookmarkTree(prisma, user.id),
    prisma.folder.count({ where: { userId: user.id } }),
  ])

  const bookmarkCount = countBookmarks(nodes)

  return (
    <div className="aqua-desktop flex h-dvh flex-col">
      <MenuBar>
        <span className="hidden text-[12px] sm:inline">{user.email}</span>
        <SignOutButton />
      </MenuBar>

      {/*
        La fenêtre de travail occupe toute la hauteur restante : c'est là qu'on
        passe son temps. L'import garde une taille fixe, il ne sert qu'au début.
      */}
      <div className="mx-auto flex w-full max-w-[1180px] min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        <MacWindow title="Importer" className="shrink-0">
          <ImportForm />
        </MacWindow>

        <MacWindow
          title="Mes favoris"
          status={`${bookmarkCount} favori${bookmarkCount > 1 ? 's' : ''}, ${folderCount} dossier${folderCount > 1 ? 's' : ''}`}
          className="min-h-0 flex-1"
        >
          {bookmarkCount === 0 ? (
            <p className="rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-4 text-[12px] text-muted-foreground">
              Aucun favori pour le moment. Déposez un export de navigateur dans
              la fenêtre du dessus.
            </p>
          ) : (
            <>
              <div className="mb-3 flex shrink-0 justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/export" download>
                    Exporter en HTML
                  </a>
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-[6px] border border-[#d2d9e6] p-2">
                <BookmarkTree nodes={nodes} />
              </div>
            </>
          )}
        </MacWindow>
      </div>
    </div>
  )
}
