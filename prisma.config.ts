import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Ce fichier n'est lu que par la CLI Prisma (migrate, db pull, studio).
 * L'application, elle, instancie PrismaClient avec un driver adapter — voir
 * src/lib/db.ts.
 *
 * POURQUOI DIRECT_URL en priorité : Neon expose deux points d'entrée pour la
 * même base. Le pooler (hôte en `-pooler`) convient au runtime serverless mais
 * casse les migrations, qui ont besoin d'une session Postgres complète. La CLI
 * doit donc passer par la connexion sans pooler.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
})
