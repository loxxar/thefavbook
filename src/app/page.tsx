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
    <>
      <MenuBar>
        <span className="hidden sm:inline">{user.email}</span>
        <SignOutButton />
      </MenuBar>

      <div className="mac-desktop flex flex-1 justify-center p-4 sm:p-8">
        <MacWindow title="Mes favoris" className="w-full max-w-[520px]">
          <dl className="mb-4 flex gap-4">
            <Counter label="Favoris" value={bookmarkCount} />
            <Counter label="Dossiers" value={folderCount} />
          </dl>

          {bookmarkCount === 0 && (
            <p className="border border-black p-3 text-[13px]">
              Aucun favori pour le moment. L&apos;import de fichiers de favoris
              arrive à la prochaine étape du Lot&nbsp;1.
            </p>
          )}
        </MacWindow>
      </div>
    </>
  )
}

interface CounterProps {
  label: string
  value: number
}

function Counter({ label, value }: CounterProps) {
  return (
    <div className="flex-1 border border-black p-3">
      <dt className="text-[12px]">{label}</dt>
      <dd className="text-[26px] leading-none font-bold tabular-nums">
        {value}
      </dd>
    </div>
  )
}
