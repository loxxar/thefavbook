import { getPrisma } from '@/lib/db'

/**
 * Nombre de soutiens reçus.
 *
 * Chiffre d'affichage uniquement. Ko-fi n'offrant aucun moyen de relire son
 * historique, un webhook manqué est perdu pour toujours : ce compteur peut
 * sous-estimer la réalité, et ne doit donc jamais servir à débloquer quoi que
 * ce soit.
 */
export async function countSupporters(): Promise<number> {
  try {
    return await getPrisma().support.count()
  } catch {
    // Un compteur décoratif ne fait pas tomber une page.
    return 0
  }
}
