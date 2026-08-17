import type { Metadata } from 'next'
import Link from 'next/link'

import { DuplicateList } from '@/components/bookmarks/duplicate-list'
import { LinkCheckPanel } from '@/components/bookmarks/link-check-panel'
import { MacWindow } from '@/components/mac/mac-window'
import { requireUser } from '@/lib/auth/session'
import { findDuplicateGroups } from '@/lib/bookmarks/duplicates'
import { BROKEN_WHERE, STATUS_UNVERIFIABLE } from '@/lib/bookmarks/link-check'
import { getPrisma } from '@/lib/db'
import { getTranslations } from '@/lib/i18n/server'
import { resolveSpaceId } from '@/lib/spaces/current'

export const metadata: Metadata = {
  title: 'thefavbook',
}

/**
 * POURQUOI une page dédiée plutôt qu'une fenêtre du tableau de bord : sur une
 * collection réelle, les groupes se comptent par milliers. Les glisser dans un
 * panneau déjà chargé rendrait les deux illisibles.
 */
export default async function EntretienPage({
  searchParams,
}: PageProps<'/entretien'>) {
  const user = await requireUser()
  const prisma = getPrisma()
  const t = await getTranslations()

  const requested = (await searchParams).espace
  const spaceId = await resolveSpaceId(
    prisma,
    user.id,
    typeof requested === 'string' ? requested : undefined,
  )

  const [
    { groups, totalGroups },
    totalCount,
    uncheckedCount,
    brokenCount,
    inconclusiveCount,
  ] = await Promise.all([
    findDuplicateGroups(prisma, user.id, spaceId),
    prisma.bookmark.count({ where: { userId: user.id, spaceId } }),
    prisma.bookmark.count({
      where: { userId: user.id, spaceId, checkedAt: null },
    }),
    prisma.bookmark.count({
      where: { userId: user.id, spaceId, ...BROKEN_WHERE },
    }),
    prisma.bookmark.count({
      where: {
        userId: user.id,
        spaceId,
        NOT: BROKEN_WHERE,
        OR: [
          { checkStatus: 0 },
          { checkStatus: STATUS_UNVERIFIABLE },
          { checkStatus: { gte: 400 } },
        ],
      },
    }),
  ])

  return (
    <div className="aqua-desktop flex h-dvh flex-col gap-2 p-3">
      <div className="shrink-0 text-[12px]">
        <Link
          href={`/?espace=${encodeURIComponent(spaceId)}`}
          className="text-white/80 underline underline-offset-2 hover:text-white"
        >
          {t.maintenance.backToBookmarks}
        </Link>
      </div>

      {/*
        Côte à côte plutôt qu'empilées : le contenu de chaque panneau est étroit
        et haut. Sur toute la largeur, la moitié droite restait vide et il
        fallait défiler la page entière pour passer d'un panneau à l'autre.
        Chacun défile désormais chez lui, et les deux tiennent à l'écran.
      */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <MacWindow
          title={t.maintenance.linkCheckTitle}
          className="min-h-0 max-lg:min-h-[320px]"
        >
          <LinkCheckPanel
            spaceId={spaceId}
            totalCount={totalCount}
            uncheckedCount={uncheckedCount}
            brokenCount={brokenCount}
            inconclusiveCount={inconclusiveCount}
          />
        </MacWindow>

        <MacWindow
          title={t.maintenance.duplicatesTitle}
          className="min-h-0 max-lg:min-h-[320px]"
        >
          <p className="mb-2 shrink-0 text-[11px] text-muted-foreground">
            {t.maintenance.duplicatesRule}
          </p>

          <DuplicateList
            groups={groups}
            totalGroups={totalGroups}
            spaceId={spaceId}
          />
        </MacWindow>
      </div>
    </div>
  )
}
