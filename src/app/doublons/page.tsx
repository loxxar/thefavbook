import type { Metadata } from 'next'
import Link from 'next/link'

import { DuplicateList } from '@/components/bookmarks/duplicate-list'
import { MacWindow } from '@/components/mac/mac-window'
import { requireUser } from '@/lib/auth/session'
import { findDuplicateGroups } from '@/lib/bookmarks/duplicates'
import { getPrisma } from '@/lib/db'
import { resolveSpaceId } from '@/lib/spaces/current'

export const metadata: Metadata = {
  title: 'Doublons — thefavbook',
}

/**
 * POURQUOI une page dédiée plutôt qu'une fenêtre du tableau de bord : sur une
 * collection réelle, les groupes se comptent par milliers. Les glisser dans un
 * panneau déjà chargé rendrait les deux illisibles.
 */
export default async function DoublonsPage({
  searchParams,
}: PageProps<'/doublons'>) {
  const user = await requireUser()
  const prisma = getPrisma()

  const requested = (await searchParams).espace
  const spaceId = await resolveSpaceId(
    prisma,
    user.id,
    typeof requested === 'string' ? requested : undefined,
  )

  const { groups, totalGroups } = await findDuplicateGroups(
    prisma,
    user.id,
    spaceId,
  )

  return (
    <div className="aqua-desktop flex h-dvh flex-col p-3">
      <MacWindow title="Doublons" className="min-h-0 flex-1">
        <div className="mb-3 shrink-0 text-[12px]">
          <Link
            href={`/?espace=${encodeURIComponent(spaceId)}`}
            className="text-primary underline underline-offset-2"
          >
            ← Retour aux favoris
          </Link>
        </div>

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
