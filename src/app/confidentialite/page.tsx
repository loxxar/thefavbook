import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalNotice } from '@/components/legal-notice'
import { MacWindow } from '@/components/mac/mac-window'

export const metadata: Metadata = {
  title: 'Confidentialité — thefavbook',
  description:
    'Où vont vos favoris, qui peut les lire, comment les récupérer et les effacer.',
}

/**
 * Page de confidentialité.
 *
 * Écrite en réponses vérifiables plutôt qu'en engagements : chaque ligne
 * correspond à quelque chose que le code fait réellement, et le dépôt est
 * public pour qu'on puisse le contrôler.
 */
export default function ConfidentialitePage() {
  return (
    <div className="aqua-desktop min-h-dvh p-4 sm:p-10">
      <MacWindow
        title="Ce que deviennent vos favoris"
        className="mx-auto w-full max-w-[720px]"
      >
        <div className="space-y-5 text-[13px] leading-relaxed">
          <p>
            Un fichier de favoris raconte beaucoup : ce que vous lisez, où vous
            travaillez, ce que vous achetez. Voici précisément ce qu&apos;il en
            advient ici.
          </p>

          <dl className="space-y-4">
            <Entry question="Où sont stockées mes données ?">
              Dans une base PostgreSQL hébergée par Neon, région{' '}
              <code>eu-central-1</code> (Francfort), donc dans l&apos;Union
              européenne. Les connexions sont chiffrées, le stockage aussi.
            </Entry>

            <Entry question="Qui peut les lire ?">
              Vous seul. Chaque requête vers la base filtre sur votre
              identifiant de compte, sans exception. Aucun autre utilisateur ne
              voit vos favoris.
            </Entry>

            <Entry question="Que stockez-vous exactement ?">
              Le titre, l&apos;URL, le dossier, la description quand votre
              navigateur en fournit une, et les dates d&apos;ajout. Les favicons
              embarqués dans votre fichier sont lus puis jetés — ils pèsent des
              mégaoctets pour rien. Le contenu des pages n&apos;est jamais
              enregistré.
            </Entry>

            <Entry question="Combien de temps ?">
              Jusqu&apos;à ce que vous les supprimiez. Aucune expiration, aucune
              purge automatique.
            </Entry>

            <Entry question="Puis-je tout récupérer ?">
              Oui, à tout moment, par le bouton « Exporter en HTML ». Le fichier
              produit est au format Netscape, celui que lisent tous les
              navigateurs : vous le réimportez dans Chrome, Firefox, Safari ou
              Edge sans passer par nous.
            </Entry>

            <Entry question="Puis-je tout effacer ?">
              Oui. La suppression du compte efface favoris, dossiers, imports et
              suggestions par cascade au niveau de la base. Il ne reste rien.
            </Entry>

            <Entry question="Mes favoris partent-ils chez un tiers ?">
              Seulement si vous activez le classement automatique, et seulement
              après un consentement explicite de votre part. Dans ce cas, les{' '}
              <strong>titres et adresses</strong> — jamais le contenu des pages
              — transitent par OpenRouter, qui les confie au modèle{' '}
              <code>gemini-2.5-flash-lite</code> de Google. Chaque requête porte
              la consigne <code>data_collection: deny</code> : les fournisseurs
              qui s&apos;autorisent l&apos;entraînement sur les requêtes sont
              écartés du routage. Sans cette activation, rien ne sort de la
              base.
            </Entry>

            <Entry question="Allez-vous consulter mes pages ?">
              Uniquement celle que vous ouvrez dans le panneau d&apos;aperçu, au
              moment où vous cliquez dessus. Le serveur y lit les informations
              de partage publiées par le site — titre, description, image — puis
              les affiche et les oublie. Rien n&apos;est enregistré, et aucune
              page n&apos;est consultée sans que vous l&apos;ayez demandé.
            </Entry>

            <Entry question="Suivez-vous ma navigation ?">
              Non. Pas de traceur publicitaire, pas de mesure d&apos;audience,
              pas de cookie autre que celui qui vous garde connecté.
            </Entry>

            <Entry question="Puis-je vérifier tout ça ?">
              Le code source est public :{' '}
              <a
                href="https://github.com/loxxar/thefavbook"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline underline-offset-2"
              >
                github.com/loxxar/thefavbook
              </a>
              . Chaque affirmation de cette page correspond à du code que vous
              pouvez lire.
            </Entry>
          </dl>

          <LegalNotice className="border-t border-[#d9d9d9] pt-4 text-muted-foreground" />

          <p>
            <Link
              href="/"
              className="text-primary underline underline-offset-2"
            >
              Retour à l&apos;application
            </Link>
          </p>
        </div>
      </MacWindow>
    </div>
  )
}

interface EntryProps {
  question: string
  children: React.ReactNode
}

function Entry({ question, children }: EntryProps) {
  return (
    <div>
      <dt className="font-semibold">{question}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  )
}
