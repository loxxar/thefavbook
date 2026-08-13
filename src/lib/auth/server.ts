import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

import { PASSWORD_MIN_LENGTH } from '@/lib/auth/schemas'
import { getPrisma } from '@/lib/db'

/**
 * Authentification.
 *
 * POURQUOI de l'auth sur un outil mono-utilisateur : la base est hébergée
 * (Neon), donc joignable depuis internet — voir DECISIONS.md.
 *
 * POURQUOI e-mail + mot de passe et rien d'autre : aucun tiers à qui confier
 * l'identité, aucun service d'envoi d'e-mails à brancher pour un seul compte.
 *
 * POURQUOI `getAuth()` et pas un `export const auth` : construire l'instance
 * exige DATABASE_URL et BETTER_AUTH_SECRET. `next build` évalue le code de
 * haut niveau des modules, y compris celui des routes — un export direct
 * ferait échouer le build sur toute machine sans ces variables.
 */

type Auth = ReturnType<typeof createAuth>

const SINGLE_ACCOUNT_MESSAGE =
  "Cette instance n'accepte qu'un seul compte, et il existe déjà."

declare global {
  // Réutilisé entre les rechargements à chaud, comme le client Prisma.
  var __auth: Auth | undefined
}

function readSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET

  if (secret === undefined || secret === '') {
    throw new Error(
      'BETTER_AUTH_SECRET est absente. Générez-la avec : openssl rand -base64 32',
    )
  }

  return secret
}

/**
 * URL publique de l'instance.
 *
 * BETTER_AUTH_URL fait autorité : c'est le domaine définitif, et les cookies de
 * session y sont rattachés. À défaut, on retombe sur l'URL du déploiement
 * Vercel — elle change à chaque déploiement de prévisualisation, ce qui est
 * précisément pourquoi elle ne peut pas servir en production.
 */
function readBaseUrl(): string {
  const explicit = process.env.BETTER_AUTH_URL

  if (explicit !== undefined && explicit !== '') return explicit

  const vercelUrl = process.env.VERCEL_URL

  if (vercelUrl !== undefined && vercelUrl !== '') return `https://${vercelUrl}`

  return 'http://localhost:3000'
}

function createAuth() {
  return betterAuth({
    appName: 'thefavbook',
    secret: readSecret(),
    baseURL: readBaseUrl(),

    database: prismaAdapter(getPrisma(), {
      provider: 'postgresql',
      // Le pooler Neon fonctionne en mode transaction : rien ne garantit qu'une
      // suite de requêtes reste sur la même session, et une transaction
      // applicative y devient silencieusement inopérante. Les opérations de
      // better-auth sont séquentielles et idempotentes, on s'en passe.
      transaction: false,
    }),

    emailAndPassword: {
      enabled: true,
      // Aucun envoi d'e-mail n'est configuré : exiger une vérification rendrait
      // le compte impossible à activer.
      requireEmailVerification: false,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      autoSignIn: true,
    },

    session: {
      // 30 jours : outil personnel, pas une banque.
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    databaseHooks: {
      user: {
        create: {
          /**
           * Verrou du compte unique.
           *
           * POURQUOI ici et pas `disableSignUp` : il faut pouvoir créer le
           * premier compte sans redéployer avec l'option inversée. Le premier
           * inscrit gagne, les suivants sont refusés.
           */
          before: async () => {
            const existing = await getPrisma().user.count()

            if (existing > 0) {
              throw new Error(SINGLE_ACCOUNT_MESSAGE)
            }
          },
        },
      },
    },

    // Doit rester en dernier : ce plugin écrit les cookies dans la réponse
    // Next.js une fois les autres hooks passés.
    plugins: [nextCookies()],
  })
}

export function getAuth(): Auth {
  if (globalThis.__auth === undefined) {
    globalThis.__auth = createAuth()
  }
  return globalThis.__auth
}
