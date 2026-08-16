import type { Metadata } from 'next'
import Link from 'next/link'

import { DuplicateList } from '@/components/bookmarks/duplicate-list'
import { LinkCheckPanel } from '@/components/bookmarks/link-check-panel'
import { MacWindow } from '@/components/mac/mac-window'
import { requireUser } from '@/lib/auth/session'
import { findDuplicateGroups } from '@/lib/bookmarks/duplicates'
import { getPrisma } from '@/lib/db'
import { resolveSpaceId } from '@/lib/spaces/current'

export const metadata: Metadata = {
  title: 'Entretien — thefavbook',
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

  const requested = (await searchParams).espace
  const spaceId = await resolveSpaceId(
    prisma,
    user.id,
    typeof requested === 'string' ? requested : undefined,
  )

  const [{ groups, totalGroups }, totalCount, uncheckedCount, brokenCount] =
    await Promise.all([
      findDuplicateGroups(prisma, user.id, spaceId),
      prisma.bookmark.count({ where: { userId: user.id, spaceId } }),
      prisma.bookmark.count({
        where: { userId: user.id, spaceId, checkedAt: null },
      }),
      prisma.bookmark.count({
        where: {
          userId: user.id,
          spaceId,
          OR: [{ checkStatus: 0 }, { checkStatus: { gte: 400 } }],
        },
      }),
    ])

  return (
    <div className="aqua-desktop flex h-dvh flex-col gap-3 p-3">
      <MacWindow title="Vérification des liens" className="shrink-0">
        <div className="mb-3 shrink-0 text-[12px]">
          <Link
            href={`/?espace=${encodeURIComponent(spaceId)}`}
            className="text-primary underline underline-offset-2"
          >
            ← Retour aux favoris
          </Link>
        </div>

        <LinkCheckPanel
          spaceId={spaceId}
          totalCount={totalCount}
          uncheckedCount={uncheckedCount}
          brokenCount={brokenCount}
        />
      </MacWindow>

      <MacWindow title="Doublons" className="min-h-0 flex-1">
        <p className="mb-3 shrink-0 text-[11px] text-muted-foreground">
          Deux adresses sont considérées identiques quand elles ne diffèrent que
          par le protocole, le <code>www</code>, un slash final ou des
          paramètres de suivi. Ce qui distingue deux pages réelles est conservé.
        </p>

        <DuplicateList
          groups={groups}
          totalGroups={totalGroups}
          spaceId={spaceId}
        />
      </MacWindow>
    </div>
  )
}
