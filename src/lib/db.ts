import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'

/**
 * Accès à la base.
 *
 * Prisma 7 impose un driver adapter : la connexion passe par `pg`, pas par un
 * moteur Rust embarqué.
 *
 * POURQUOI une fonction et pas un export direct : `next build` évalue le code
 * de haut niveau des modules. Un client construit à l'import ferait échouer le
 * build sur toute machine où DATABASE_URL n'est pas encore renseignée.
 *
 * POURQUOI pas un Proxy paresseux : les adaptateurs d'authentification
 * inspectent l'objet client (présence de méthodes, énumération), et un Proxy
 * casse ces vérifications de façon silencieuse.
 */

declare global {
  // Réutilisé entre les rechargements à chaud du serveur de développement,
  // sinon chaque édition de fichier ouvre un nouveau pool de connexions.
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (connectionString === undefined || connectionString === '') {
    throw new Error(
      'DATABASE_URL est absente. Copiez .env.example vers .env et renseignez la chaîne de connexion Neon.',
    )
  }

  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export function getPrisma(): PrismaClient {
  if (globalThis.__prisma === undefined) {
    globalThis.__prisma = createPrismaClient()
  }
  return globalThis.__prisma
}
