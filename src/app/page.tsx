import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { requireUser } from '@/lib/auth/session'
import { readWorkspace } from '@/lib/bookmarks/rows'
import { getPrisma } from '@/lib/db'
import { listSpaces, resolveSpaceId } from '@/lib/spaces/current'
import { countSupporters } from '@/lib/support/count'

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const user = await requireUser()
  const prisma = getPrisma()

  const requested = (await searchParams).espace
  const spaceId = await resolveSpaceId(
    prisma,
    user.id,
    typeof requested === 'string' ? requested : undefined,
  )

  // Chaque requête filtre sur userId et sur l'espace — le premier cloisonne les
  // comptes, le second les collections.
  const [data, account, unclassifiedCount, supporterCount, spaces] =
    await Promise.all([
      readWorkspace(prisma, user.id, spaceId),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { aiConsentAt: true },
      }),
      prisma.bookmark.count({
        where: { userId: user.id, spaceId, suggestion: { is: null } },
      }),
      countSupporters(),
      listSpaces(prisma, user.id),
    ])

  return (
    <DashboardShell
      email={user.email}
      bookmarkCount={data.counts.total}
      folderCount={data.folders.length}
      supporterCount={supporterCount}
      spaces={spaces}
      currentSpaceId={spaceId}
      data={data}
      hasConsent={account?.aiConsentAt != null}
      unclassifiedCount={unclassifiedCount}
      pendingCount={data.counts.suggestions}
    />
  )
}
