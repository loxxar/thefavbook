import { cn } from '@/lib/utils'
import { getTranslations } from '@/lib/i18n/server'

interface LegalNoticeProps {
  className?: string
}

/**
 * Mention d'indépendance.
 *
 * L'interface s'inspire ouvertement de Mac OS X. Le dire évite toute confusion
 * sur l'origine du produit — d'autant qu'un visiteur y dépose des données
 * personnelles et doit savoir à qui il les confie.
 *
 * La marque de la barre de menus n'emprunte volontairement aucun logo : voir
 * `ProductMark`.
 */
export async function LegalNotice({ className }: LegalNoticeProps) {
  const t = await getTranslations()

  return (
    <p className={cn('text-[11px] leading-relaxed', className)}>
      {t.legal.notice}
    </p>
  )
}
