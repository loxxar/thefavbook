'use client'

import { useActionState } from 'react'

import { useTranslations } from '@/components/i18n/translations-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { importBookmarksAction } from '@/lib/bookmarks/actions'
import { INITIAL_IMPORT_STATE } from '@/lib/bookmarks/import-state'

interface ImportFormProps {
  /** L'import atterrit dans cet espace. */
  spaceId: string
}

export function ImportForm({ spaceId }: ImportFormProps) {
  const { t } = useTranslations()
  const [state, formAction, isPending] = useActionState(
    importBookmarksAction,
    INITIAL_IMPORT_STATE,
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="spaceId" value={spaceId} />
      <div className="space-y-1.5">
        <Label htmlFor="files" className="text-[12px] font-semibold">
          {t.importer.files}
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
          {t.importer.filesHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sourceLabel" className="text-[12px] font-semibold">
          {t.importer.source}{' '}
          <span className="font-normal">{t.importer.optional}</span>
        </Label>
        <Input
          id="sourceLabel"
          name="sourceLabel"
          maxLength={80}
          placeholder={t.importer.sourcePlaceholder}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.importer.submitting : t.importer.submit}
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
            {t.importer.progress}
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
