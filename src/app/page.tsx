import { SignOutButton } from '@/components/auth/sign-out-button'
import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

export default async function HomePage() {
  const user = await requireUser()
  const prisma = getPrisma()

  // Chaque requête filtre sur userId — c'est la seule barrière, voir
  // CONVENTIONS.md.
  const [bookmarkCount, folderCount] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.folder.count({ where: { userId: user.id } }),
  ])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">thefavbook</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <main className="flex flex-1 flex-col gap-6">
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <dt className="text-sm text-muted-foreground">Favoris</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {bookmarkCount}
            </dd>
          </div>
          <div className="rounded-lg border p-4">
            <dt className="text-sm text-muted-foreground">Dossiers</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {folderCount}
            </dd>
          </div>
        </dl>

        {bookmarkCount === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Aucun favori pour le moment. L&apos;import de fichiers de favoris
            arrive à la prochaine étape du Lot&nbsp;1.
          </p>
        )}
      </main>
    </div>
  )
}
