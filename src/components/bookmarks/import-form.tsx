'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { importBookmarksAction } from '@/lib/bookmarks/actions'
import { INITIAL_IMPORT_STATE } from '@/lib/bookmarks/import-state'

export function ImportForm() {
  const [state, formAction, isPending] = useActionState(
    importBookmarksAction,
    INITIAL_IMPORT_STATE,
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="files" className="text-[12px] font-semibold">
          Fichiers de favoris
        </Label>
        <Input
          id="files"
          name="files"
          type="file"
          multiple
          required
          accept=".html,.htm,text/html"
          className="h-auto py-1 file:mr-2 file:rounded-[10px] file:border file:border-[#9a9a9a] file:bg-[linear-gradient(to_bottom,#ffffff,#e3e3e3)] file:px-2 file:py-0.5 file:text-[11px]"
        />
        <p className="text-[11px] text-muted-foreground">
          Export Chrome, Firefox, Safari ou Edge. Plusieurs fichiers à la fois
          sont fusionnés.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sourceLabel" className="text-[12px] font-semibold">
          Provenance <span className="font-normal">(facultatif)</span>
        </Label>
        <Input
          id="sourceLabel"
          name="sourceLabel"
          maxLength={80}
          placeholder="Chrome perso"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Import en cours…' : 'Importer'}
      </Button>

      {isPending && (
        <div className="space-y-1.5">
          <div
            className="aqua-progress"
            role="progressbar"
            aria-label="Import en cours"
          >
            <div className="aqua-progress-bar" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Lecture du fichier, analyse et écriture en base. Sur plusieurs
            milliers de favoris, comptez une poignée de secondes.
          </p>
        </div>
      )}

      {state.status !== 'idle' && (
        <div
          role="status"
          className={
            state.status === 'error'
              ? 'text-[12px] text-destructive'
              : 'text-[12px] text-[#1f7a33]'
          }
        >
          <p>{state.message}</p>
          {state.imported.length > 1 && (
            <ul className="mt-1 list-disc pl-4 text-muted-foreground">
              {state.imported.map((i) => (
                <li key={i.fileName}>
                  {i.fileName} — {i.bookmarks} favoris, {i.folders} dossiers
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  )
}
