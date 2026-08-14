import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

import { PASSWORD_MIN_LENGTH } from '@/lib/auth/schemas'
import { getPrisma } from '@/lib/db'

/**
 * Authentification.
 *
 * L'instance est ouverte : chacun crée son compte et ne voit que ses favoris.
 * Le cloisonnement repose entièrement sur le filtrage par `userId` — voir
 * CONVENTIONS.md.
 *
 * POURQUOI e-mail + mot de passe et rien d'autre : aucun tiers à qui confier
 * l'identité de ses utilisateurs.
 *
 * POURQUOI `getAuth()` et pas un `export const auth` : construire l'instance
 * exige DATABASE_URL et BETTER_AUTH_SECRET. `next build` évalue le code de
 * haut niveau des modules, y compris celui des routes — un export direct
 * ferait échouer le build sur toute machine sans ces variables.
 */

type Auth = ReturnType<typeof createAuth>

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

    // Le stockage en base plutôt qu'en mémoire : sur Vercel chaque requête peut
    // atterrir sur une instance différente, un compteur en mémoire ne verrait
    // qu'une fraction du trafic et ne limiterait rien.
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: {
        '/sign-up/email': { window: 3600, max: 5 },
        '/sign-in/email': { window: 300, max: 10 },
      },
    },

    session: {
      // 30 jours : un gestionnaire de favoris, pas une banque.
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
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
