# Conventions

## TypeScript

- Mode strict. Pas de `any`, pas de `as` de confort.
- Zod sur toute entrée externe : formulaires, corps de requête, variables
  d'environnement.
- Types explicites sur les fonctions exportées.
- `interface` pour les objets de domaine, `type` pour les unions et utilitaires.

## Nommage

| Élément | Forme | Exemple |
|---|---|---|
| Composant React | PascalCase | `BookmarkTree` |
| Fonction, variable | camelCase | `canonicalizeUrl` |
| Constante globale | UPPER_SNAKE_CASE | `TRACKING_PARAMS` |
| Fichier composant | kebab-case.tsx | `bookmark-tree.tsx` |
| Fichier logique | kebab-case.ts | `parse.ts` |
| Dossier | kebab-case | `src/lib/bookmarks` |

Les noms de fonctions disent ce qu'elles font, pas ce qu'elles manipulent :
`countBookmarks`, pas `bookmarks`.

## Composants React

- Server Components par défaut. `"use client"` seulement quand l'interactivité
  l'exige.
- Environ 100 lignes maximum, sinon on découpe.
- Props typées par une interface déclarée juste au-dessus du composant.
- Pas de logique métier dans un composant : elle vit dans `src/lib`.

## Fonctions

- Une responsabilité. Retour anticipé plutôt qu'imbrication.
- `async`/`await`, jamais de chaîne de `.then()`.

## Commentaires

On commente le **pourquoi**, jamais le **quoi**. Un commentaire qui paraphrase
le code suivant est du bruit ; un commentaire qui explique pourquoi on a écarté
l'approche évidente vaut de l'or.

Les commentaires du domaine (`src/lib/bookmarks`) sont la mémoire des pièges du
format Netscape — ils sont à maintenir avec le code.

Marqueurs : `TODO` (à faire), `FIXME` (défaut connu), `HACK` (contournement
temporaire, avec la raison).

## Tests

- Vitest. Nommage : `should [comportement attendu] when [condition]`.
- On teste la logique métier, pas les composants d'interface triviaux.
- Tout défaut corrigé arrive avec le test qui l'aurait attrapé.

## Sécurité

- Validation côté serveur systématique. Le client n'est jamais digne de
  confiance.
- Aucun secret dans le code. `.env.example` reste à jour.
- **Chaque requête Prisma filtre sur `userId`.** Aucune RLS n'est définie et la
  connexion est propriétaire : c'est la seule barrière — voir ARCHITECTURE.md.

## Git

Conventional Commits : `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.
Un commit par étape cohérente, pas un commit par fichier.
