import { ClassifyPanel } from '@/components/ai/classify-panel'
import {
  SuggestionList,
  type SuggestionRow,
} from '@/components/ai/suggestion-list'
import { BookmarkBrowser } from '@/components/bookmarks/bookmark-browser'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { LegalNotice } from '@/components/legal-notice'
import { MacWindow } from '@/components/mac/mac-window'
import { requireUser } from '@/lib/auth/session'
import { readBookmarkTree } from '@/lib/bookmarks/tree'
import { countBookmarks } from '@/lib/bookmarks/types'
import { getPrisma } from '@/lib/db'
import { getTranslations } from '@/lib/i18n/server'
import { listSpaces, resolveSpaceId } from '@/lib/spaces/current'
import { countSupporters } from '@/lib/support/count'

/** Au-delà, la liste de triage devient illisible : on pagine par le triage. */
const TRIAGE_PAGE_SIZE = 50

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const user = await requireUser()
  const prisma = getPrisma()
  const t = await getTranslations()

  const requested = (await searchParams).espace
  const spaceId = await resolveSpaceId(
    prisma,
    user.id,
    typeof requested === 'string' ? requested : undefined,
  )

  // Chaque requête filtre sur userId et sur l'espace — le premier cloisonne les
  // comptes, le second les collections.
  const [
    nodes,
    folderCount,
    account,
    unclassifiedCount,
    pendingCount,
    pending,
    supporterCount,
    spaces,
  ] = await Promise.all([
    readBookmarkTree(prisma, user.id, spaceId),
    prisma.folder.count({ where: { userId: user.id, spaceId } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { aiConsentAt: true },
    }),
    prisma.bookmark.count({
      where: { userId: user.id, spaceId, suggestion: { is: null } },
    }),
    prisma.suggestion.count({
      where: { userId: user.id, status: 'PENDING', bookmark: { spaceId } },
    }),
    prisma.suggestion.findMany({
      where: { userId: user.id, status: 'PENDING', bookmark: { spaceId } },
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
    countSupporters(),
    listSpaces(prisma, user.id),
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
      supporterCount={supporterCount}
      spaces={spaces}
      currentSpaceId={spaceId}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/*
          shrink-0 : une piste de grille `auto` se laisse comprimer quand la
          hauteur manque, ce qui repoussait le bouton de lancement sous un
          défilement. En flex, cette rangée garde sa hauteur naturelle et c'est
          la fenêtre des favoris qui cède.
        */}
        {bookmarkCount > 0 && (
          <div className="grid shrink-0 gap-3 lg:grid-cols-2">
            <MacWindow title={t.dashboard.sortWithAi}>
              <ClassifyPanel
                hasConsent={account?.aiConsentAt != null}
                unclassifiedCount={unclassifiedCount}
                pendingCount={pendingCount}
                spaceId={spaceId}
              />
            </MacWindow>

            {/*
              La fenêtre est posée en absolu dans un conteneur vide : elle
              n'impose alors aucune hauteur propre et épouse exactement celle
              de la rangée, fixée par le panneau de gauche.
            */}
            <div className="relative min-h-[320px]">
              <MacWindow
                title={t.dashboard.suggestions}
                className="absolute inset-0"
              >
                {pendingCount === 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    {t.dashboard.noSuggestions}
                  </p>
                ) : (
                  <SuggestionList
                    suggestions={suggestions}
                    totalPending={pendingCount}
                  />
                )}
              </MacWindow>
            </div>
          </div>
        )}

        <MacWindow
          title={t.dashboard.bookmarks}
          status={t.dashboard.counts(bookmarkCount, folderCount)}
          className="min-h-[320px] flex-1"
        >
          {bookmarkCount === 0 ? (
            <p className="rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-4 text-[12px] text-muted-foreground">
              {t.dashboard.emptySpace}
            </p>
          ) : (
            <BookmarkBrowser nodes={nodes} spaceId={spaceId} />
          )}
        </MacWindow>

        <LegalNotice className="shrink-0 px-1 pb-1 text-white/60" />
      </div>
    </DashboardShell>
  )
}
