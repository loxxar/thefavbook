'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth/session'
import { getPrisma } from '@/lib/db'

/**
 * Consentement à l'envoi des titres et URL au service de classement.
 *
 * Enregistré comme une date, pas un booléen : savoir *quand* le consentement a
 * été donné importe autant que son existence, notamment s'il faut le
 * redemander après un changement de fournisseur.
 */
export async function setAiConsentAction(granted: boolean): Promise<void> {
  const user = await requireUser()

  await getPrisma().user.update({
    where: { id: user.id },
    data: { aiConsentAt: granted ? new Date() : null },
  })

  revalidatePath('/')
}

/**
 * Suppression définitive du compte.
 *
 * Une seule instruction suffit : favoris, dossiers, imports, suggestions et
 * sessions portent tous `onDelete: Cascade` vers l'utilisateur. La garantie
 * est posée au niveau de la base, pas dans du code applicatif qu'on pourrait
 * oublier de tenir à jour.
 */
export async function deleteAccountAction(): Promise<never> {
  const user = await requireUser()

  await getPrisma().user.delete({ where: { id: user.id } })

  redirect('/connexion')
}
