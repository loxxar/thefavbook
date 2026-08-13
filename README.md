# thefavbook

Back-office de reprise en main des favoris de navigateur. On y dépose les
fichiers HTML exportés par Chrome, Firefox, Safari, Edge ou Brave, on fusionne,
on nettoie, on réorganise, puis on ré-exporte un fichier propre réimportable
dans n'importe quel navigateur.

## Le problème

Des favoris accumulés sur plusieurs navigateurs pendant des années : des
doublons partout, des liens morts, des dossiers qui ne veulent plus rien dire.
Les afficher dans un arbre ne résout rien — le vrai obstacle est de **traiter
quelques milliers d'entrées sans y passer un week-end**.

## Les quatre fonctions qui comptent

1. **Dédoublonnage canonique** — normalisation d'URL (protocole, `www`, slash
   final, `utm_*`, `fbclid`) : les six copies du même lien récoltées sur quatre
   navigateurs deviennent une seule entrée.
2. **Health check de masse** — chaque lien testé : vivant, redirigé (avec
   proposition de mise à jour), mort, injoignable.
3. **Mode Triage clavier** — un favori à la fois, plein écran, tout au clavier.
   C'est ce qui permet de vider la pile en une soirée plutôt que jamais.
4. **Classement par règles + détection de clusters** — rangement déterministe
   par domaine et mots-clés, puis regroupement sémantique des restes.

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript strict |
| Style | Tailwind CSS v4 + shadcn/ui |
| Base de données | Neon Postgres |
| ORM | Prisma 7 (driver adapter `pg`) |
| Auth | Better-Auth |
| Tests | Vitest |
| Package manager | pnpm |

## Démarrage

```bash
pnpm install
cp .env.example .env   # puis renseigner les URL Neon et le secret Better-Auth
pnpm db:migrate
pnpm dev
```

## Scripts

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm test` | Suite Vitest |
| `pnpm test:watch` | Vitest en mode veille |
| `pnpm typecheck` | Vérification TypeScript sans émission |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Régénère le client Prisma |
| `pnpm db:migrate` | Applique les migrations en développement |
| `pnpm db:studio` | Prisma Studio |

## Documents de référence

- [ARCHITECTURE.md](ARCHITECTURE.md) — structure du système et raisonnement
- [CONVENTIONS.md](CONVENTIONS.md) — style de code et nommage
- [DECISIONS.md](DECISIONS.md) — journal des décisions techniques
- [CURRENT_TASK.md](CURRENT_TASK.md) — objectif et périmètre de la session
