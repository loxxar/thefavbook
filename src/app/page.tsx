import Link from 'next/link'

import { ClassifyPanel } from '@/components/ai/classify-panel'
import {
  SuggestionList,
  type SuggestionRow,
} from '@/components/ai/suggestion-list'
import { DeleteAccountButton } from '@/components/auth/delete-account-button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { BookmarkBrowser } from '@/components/bookmarks/bookmark-browser'
import { ImportForm } from '@/components/bookmarks/import-form'
import { MacWindow } from '@/components/mac/mac-window'
import { MenuBar } from '@/components/mac/menu-bar'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth/session'
import { readBookmarkTree } from '@/lib/bookmarks/tree'
import { countBookmarks } from '@/lib/bookmarks/types'
import { getPrisma } from '@/lib/db'

/** Au-delà, la liste de triage devient illisible : on pagine par le triage. */
const TRIAGE_PAGE_SIZE = 50

export default async function HomePage() {
  const user = await requireUser()
  const prisma = getPrisma()

  // Chaque requête filtre sur userId — c'est la seule barrière, voir
  // CONVENTIONS.md.
  const [nodes, folderCount, account, unclassifiedCount, pendingCount, pending] =
    await Promise.all([
      readBookmarkTree(prisma, user.id),
      prisma.folder.count({ where: { userId: user.id } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { aiConsentAt: true },
      }),
      prisma.bookmark.count({
        where: { userId: user.id, suggestion: { is: null } },
      }),
      prisma.suggestion.count({ where: { userId: user.id, status: 'PENDING' } }),
      prisma.suggestion.findMany({
        where: { userId: user.id, status: 'PENDING' },
        take: TRIAGE_PAGE_SIZE,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          folderPath: true,
          reason: true,
          title: true,
          bookmark: { select: { title: true, url: true } },
        },
      }),
    ])

  const bookmarkCount = countBookmarks(nodes)

  const suggestions: SuggestionRow[] = pending.map((s) => ({
    id: s.id,
    folderPath: s.folderPath,
    reason: s.reason,
    newTitle: s.title,
    bookmarkTitle: s.bookmark.title,
    bookmarkUrl: s.bookmark.url,
  }))

  return (
    <div className="aqua-desktop flex h-dvh flex-col">
      <MenuBar>
        <Link
          href="/confidentialite"
          className="hidden text-[12px] underline underline-offset-2 sm:inline"
        >
          Confidentialité
        </Link>
        <span className="hidden text-[12px] sm:inline">{user.email}</span>
        <SignOutButton />
      </MenuBar>

      <div className="mx-auto flex w-full max-w-[1400px] min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
        {bookmarkCount === 0 && (
          <MacWindow title="Importer" className="shrink-0">
            <ImportForm />
          </MacWindow>
        )}

        {bookmarkCount > 0 && (
          <MacWindow title="Ranger avec l’IA" className="shrink-0">
            <ClassifyPanel
              hasConsent={account?.aiConsentAt != null}
              unclassifiedCount={unclassifiedCount}
              pendingCount={pendingCount}
            />
          </MacWindow>
        )}

        {pendingCount > 0 && (
          <MacWindow
            title="Propositions de rangement"
            className="max-h-[420px] min-h-0 shrink-0"
          >
            <SuggestionList
              suggestions={suggestions}
              totalPending={pendingCount}
            />
          </MacWindow>
        )}

        <MacWindow
          title="Mes favoris"
          status={`${bookmarkCount} favori${bookmarkCount > 1 ? 's' : ''}, ${folderCount} dossier${folderCount > 1 ? 's' : ''}`}
          className="min-h-[280px] flex-1"
        >
          {bookmarkCount === 0 ? (
            <p className="rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-4 text-[12px] text-muted-foreground">
              Aucun favori pour le moment. Déposez un export de navigateur dans
              la fenêtre du dessus.
            </p>
          ) : (
            <>
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                <details className="text-[12px]">
                  <summary className="cursor-default text-muted-foreground">
                    Importer d&apos;autres fichiers
                  </summary>
                  <div className="mt-3 w-full max-w-[420px]">
                    <ImportForm />
                  </div>
                </details>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/export" download>
                    Exporter en HTML
                  </a>
                </Button>
              </div>
              <BookmarkBrowser nodes={nodes} />
            </>
          )}
        </MacWindow>

        <div className="flex shrink-0 justify-end pb-2">
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}
