import { SignOutButton } from '@/components/auth/sign-out-button'
import { MacWindow } from '@/components/mac/mac-window'
import { MenuBar } from '@/components/mac/menu-bar'
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
    <div className="aqua-desktop flex min-h-full flex-1 flex-col">
      <MenuBar>
        <span className="hidden text-[12px] sm:inline">{user.email}</span>
        <SignOutButton />
      </MenuBar>

      <div className="flex flex-1 justify-center p-4 sm:p-10">
        <MacWindow
          title="Mes favoris"
          status={`${bookmarkCount} favori${bookmarkCount > 1 ? 's' : ''}, ${folderCount} dossier${folderCount > 1 ? 's' : ''}`}
          className="h-fit w-full max-w-[560px]"
        >
          <dl className="mb-5 flex gap-4">
            <Counter label="Favoris" value={bookmarkCount} />
            <Counter label="Dossiers" value={folderCount} />
          </dl>

          {bookmarkCount === 0 && (
            <p className="rounded-[6px] border border-dashed border-[#b3bac6] bg-[#f7f9fc] p-4 text-[12px] text-muted-foreground">
              Aucun favori pour le moment. L&apos;import de fichiers de favoris
              arrive à la prochaine étape du Lot&nbsp;1.
            </p>
          )}
        </MacWindow>
      </div>
    </div>
  )
}

interface CounterProps {
  label: string
  value: number
}

function Counter({ label, value }: CounterProps) {
  return (
    <div className="flex-1 rounded-[6px] border border-[#b3bac6] bg-[linear-gradient(to_bottom,var(--sidebar-top),var(--sidebar-bottom))] p-3">
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-[26px] leading-tight font-semibold tabular-nums text-[#1f2937]">
        {value}
      </dd>
    </div>
  )
}
