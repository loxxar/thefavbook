'use client'

import { useDroppable } from '@dnd-kit/core'
import { useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  createFolderAction,
  deleteFolderAction,
  renameFolderAction,
} from '@/lib/bookmarks/folder-actions'
import type { ParsedFolder } from '@/lib/bookmarks/types'

interface FolderRowProps {
  node: ParsedFolder
  open: boolean
  children: ReactNode
}

/**
 * Un dossier de l'arbre : cible de dépôt, et commandes de gestion.
 *
 * Les commandes n'apparaissent qu'au survol ou au focus. Toujours visibles,
 * elles noieraient une arborescence de plusieurs centaines de dossiers.
 */
export function FolderRow({ node, open, children }: FolderRowProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [isPending, startTransition] = useTransition()

  const folderId = node.id

  // Un dossier sans identifiant vient d'un fichier non encore importé : il
  // n'accueille aucun déplacement et ne se gère pas.
  const { setNodeRef, isOver } = useDroppable({
    id: folderId ?? `sans-id-${node.title}`,
    disabled: folderId === undefined,
  })

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action()

      if (!result.ok && result.message !== '') toast.error(result.message)
    })
  }

  return (
    <details open={open}>
      <summary
        ref={setNodeRef}
        className={`group flex cursor-default items-center gap-1 rounded-[4px] px-1 py-0.5 marker:text-[#6b7280] ${
          isOver
            ? 'bg-[linear-gradient(to_bottom,var(--accent-top),var(--accent-bottom))] text-white'
            : 'hover:bg-[#e6ebf4]'
        }`}
      >
        {isRenaming && folderId !== undefined ? (
          <RenameField
            initial={node.title}
            disabled={isPending}
            onCancel={() => setIsRenaming(false)}
            onSubmit={(name) => {
              setIsRenaming(false)
              run(() => renameFolderAction(folderId, name))
            }}
          />
        ) : (
          <>
            <span className="truncate font-semibold">{node.title}</span>
            <span
              className={`text-[11px] ${isOver ? 'text-white' : 'text-muted-foreground'}`}
            >
              {node.children.length}
            </span>

            {folderId !== undefined && (
              <span className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <RowButton
                  label="Renommer"
                  disabled={isPending}
                  onClick={() => setIsRenaming(true)}
                >
                  Renommer
                </RowButton>
                <RowButton
                  label="Nouveau sous-dossier"
                  disabled={isPending}
                  onClick={() => {
                    const name = prompt('Nom du sous-dossier')

                    if (name !== null && name.trim() !== '') {
                      run(() => createFolderAction(name, folderId))
                    }
                  }}
                >
                  +
                </RowButton>
                <RowButton
                  label="Supprimer le dossier"
                  disabled={isPending}
                  onClick={() => run(() => deleteFolderAction(folderId))}
                >
                  Supprimer
                </RowButton>
              </span>
            )}
          </>
        )}
      </summary>

      <div className="ml-4 border-l border-[#d2d9e6] pl-2">{children}</div>
    </details>
  )
}

interface RowButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

function RowButton({ label, disabled, onClick, children }: RowButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        // Sans cela, le clic replierait le dossier au lieu d'agir dessus.
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className="rounded-[3px] border border-[#9a9a9a] bg-white/80 px-1 text-[10px] text-[#333] hover:bg-white disabled:opacity-40"
    >
      {children}
    </button>
  )
}

interface RenameFieldProps {
  initial: string
  disabled: boolean
  onSubmit: (name: string) => void
  onCancel: () => void
}

function RenameField({
  initial,
  disabled,
  onSubmit,
  onCancel,
}: RenameFieldProps) {
  const [value, setValue] = useState(initial)

  return (
    <input
      autoFocus
      value={value}
      disabled={disabled}
      onChange={(event) => setValue(event.target.value)}
      onClick={(event) => event.preventDefault()}
      onBlur={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          if (value.trim() !== '') onSubmit(value)
        }
        if (event.key === 'Escape') onCancel()
      }}
      className="w-full rounded-[3px] border border-[#5b9bf5] px-1 text-[12px] outline-none"
    />
  )
}
