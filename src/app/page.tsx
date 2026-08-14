import { ClassifyPanel } from '@/components/ai/classify-panel'
import {
  SuggestionList,
  type SuggestionRow,
} from '@/components/ai/suggestion-list'
import { BookmarkBrowser } from '@/components/bookmarks/bookmark-browser'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { MacWindow } from '@/components/mac/mac-window'
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
    <DashboardShell
      email={user.email}
      bookmarkCount={bookmarkCount}
      folderCount={folderCount}
    >
      {/*
        Deux rangées. En haut les panneaux de travail, côte à côte et de
        hauteur bornée : choisir un critère ou trancher des propositions ne
        demande pas la moitié de l'écran. En bas les favoris, qui prennent tout
        le reste — c'est là qu'on passe son temps.
      */}
      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3">
        {bookmarkCount > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            <MacWindow title="Ranger avec l’IA" className="max-h-[320px]">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ClassifyPanel
                  hasConsent={account?.aiConsentAt != null}
                  unclassifiedCount={unclassifiedCount}
                  pendingCount={pendingCount}
                />
              </div>
            </MacWindow>

            <MacWindow
              title="Propositions de rangement"
              className="max-h-[320px]"
            >
              {pendingCount === 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  Aucune proposition en attente. Lancez un rangement dans le
                  panneau de gauche.
                </p>
              ) : (
                <SuggestionList
                  suggestions={suggestions}
                  totalPending={pendingCount}
                />
              )}
            </MacWindow>
          </div>
        )}

        <MacWindow
          title="Mes favoris"
          status={`${bookmarkCount} favori${bookmarkCount > 1 ? 's' : ''}, ${folderCount} dossier${folderCount > 1 ? 's' : ''}`}
          className="min-h-0"
        >
          {bookmarkCount === 0 ? (
            <p className="rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-4 text-[12px] text-muted-foreground">
              Aucun favori pour le moment. Ouvrez le menu Fichier puis
              « Importer des favoris » pour déposer un export de navigateur.
            </p>
          ) : (
            <BookmarkBrowser nodes={nodes} />
          )}
        </MacWindow>
      </div>
    </DashboardShell>
  )
}
