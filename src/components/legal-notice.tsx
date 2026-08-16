import { cn } from '@/lib/utils'

interface LegalNoticeProps {
  className?: string
}

/**
 * Mention d'indépendance.
 *
 * L'interface s'inspire ouvertement de Mac OS X. Le dire évite toute
 * confusion sur l'origine du produit — d'autant qu'un visiteur y dépose des
 * données personnelles et doit savoir à qui il les confie.
 *
 * La marque de la barre de menus n'emprunte volontairement aucun logo :
 * voir `ProductMark`.
 */
export function LegalNotice({ className }: LegalNoticeProps) {
  return (
    <p className={cn('text-[11px] leading-relaxed', className)}>
      thefavbook n&apos;est ni affilié à Apple, ni approuvé par Apple. Son
      apparence est un hommage à Mac OS X. Les marques citées appartiennent à
      leurs propriétaires respectifs.
    </p>
  )
}
