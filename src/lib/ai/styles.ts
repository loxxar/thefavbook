/**
 * Styles de rangement.
 *
 * Une même collection se range de plusieurs façons également valables : par
 * sujet, par nature de ressource, par plateforme, par intention. Imposer une
 * seule logique reviendrait à décider à la place de l'utilisateur comment il
 * pense sa propre bibliothèque.
 *
 * Module sans dépendance serveur : le catalogue sert aussi à l'interface.
 */

export interface ClassificationStyle {
  id: string
  label: string
  /** Une phrase, affichée sous le nom du style. */
  summary: string
  /** Consignes injectées dans l'invite, à la place des règles par défaut. */
  rules: string
}

export const CLASSIFICATION_STYLES: ClassificationStyle[] = [
  {
    id: 'theme',
    label: 'Par thème',
    summary: 'Ce dont ça parle : Travail, Finances, Santé, Loisirs…',
    rules: `- Regroupe par sujet traité, pas par nature de ressource ni par plateforme.
- Deux niveaux au maximum, séparés par " / ". Exemple : "Travail / Comptabilité".
- Vise entre 12 et 25 dossiers de premier niveau pour une collection entière.`,
  },
  {
    id: 'type',
    label: 'Par type de ressource',
    summary:
      'Ce que c’est : Documentation, Outils, Articles, Vidéos, Boutiques…',
    rules: `- Regroupe par nature de la ressource : documentation, outil en ligne,
  article, vidéo, boutique, tableau de bord, formulaire, forum.
- Le second niveau précise le domaine. Exemple : "Documentation / Développement".
- Vise entre 8 et 15 dossiers de premier niveau.`,
  },
  {
    id: 'service',
    label: 'Par service',
    summary: 'La plateforme d’origine : Google, GitHub, Notion…',
    rules: `- Regroupe par service ou plateforme auquel appartient l'adresse.
- Un dossier "Divers" accueille les domaines isolés, pour éviter une poussière
  de dossiers à un seul favori.
- Un seul niveau, sauf pour les services aux usages très distincts — par exemple
  "Google / Drive" et "Google / Analytics".`,
  },
  {
    id: 'intention',
    label: 'Par intention',
    summary: 'Ce que vous comptez en faire : À lire, À essayer, Références…',
    rules: `- Regroupe par usage prévu : "À lire", "À essayer", "Références",
  "Comptes et accès", "Achats", "Archives".
- Déduis l'intention du titre et de l'adresse : une page de connexion relève des
  comptes, un article de la lecture, une documentation des références.
- Un seul niveau, six à dix dossiers au total.`,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    summary: 'Une dizaine de dossiers larges, un seul niveau.',
    rules: `- Un seul niveau, jamais de sous-dossier.
- Dix dossiers au maximum pour la collection entière, quitte à être large.
- Mieux vaut un dossier un peu vague que la multiplication des cas particuliers.`,
  },
]

export const DEFAULT_STYLE_ID = 'theme'

export function findStyle(id: string): ClassificationStyle {
  return (
    CLASSIFICATION_STYLES.find((s) => s.id === id) ??
    CLASSIFICATION_STYLES.find((s) => s.id === DEFAULT_STYLE_ID)!
  )
}
