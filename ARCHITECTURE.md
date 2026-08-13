# Architecture

## Principe directeur

Le domaine métier — parsing, normalisation d'URL, export — est **du TypeScript
pur, sans dépendance à Prisma, à React ou à Next**. Il se teste sans base de
données et sans navigateur. Tout le reste (routes, composants, persistance)
s'appuie dessus.

Conséquence pratique : la suite de tests tourne en moins d'une seconde et le
cœur du produit reste vérifiable même si l'infrastructure change.

## Structure

```
src/
  lib/
    bookmarks/          Domaine métier — aucune dépendance externe
      types.ts          Modèle d'arbre (ParsedFolder / ParsedBookmark)
      parse.ts          Lecture du Netscape Bookmark File Format
      export.ts         Écriture du même format
      url.ts            Normalisation d'URL pour le dédoublonnage
    db.ts               Accès Prisma (driver adapter pg)
  app/                  Routes Next.js (App Router)
  components/
    ui/                 Primitives shadcn/ui
  generated/prisma/     Client Prisma généré — non versionné
prisma/
  schema.prisma         Modèle de données
```

## Le parseur, et pourquoi il n'utilise pas d'arbre DOM

Le format d'export commun à tous les navigateurs est le **Netscape Bookmark
File Format**. Il ressemble à du HTML mais n'en est pas : `<DT>`, `<DD>` et
`<p>` ne sont jamais fermés.

```html
<DL><p>
    <DT><H3 ADD_DATE="1609459200">Dev</H3>
    <DL><p>
        <DT><A HREF="https://example.com" ADD_DATE="1609459200">Exemple</A>
        <DD>Une description
    </DL><p>
</DL><p>
```

Chaque parseur HTML « répare » cet arbre à sa façon, et la hiérarchie
reconstruite devient non fiable. En revanche `<DL>` et `</DL>` sont toujours
appariés et délimitent **exactement** les dossiers.

`parse.ts` suit donc un flux d'événements `htmlparser2` avec une pile de `<DL>`
et ignore complètement l'arbre reconstruit. Un `<H3>` met un dossier en attente,
le `<DL>` suivant l'empile, `</DL>` le dépile.

Un seul parseur couvre tous les navigateurs : il n'y a pas d'adaptateur par
navigateur, seulement des variantes d'attributs (`TAGS` chez Firefox, unités de
date différentes chez Safari) traitées localement.

## Le test qui protège tout le reste

`parse.test.ts` vérifie que `parse(export(parse(x))) === parse(x)`. Si l'export
ne restitue pas exactement ce que l'import a lu, l'application perd des données
utilisateur. Ce test tourne avant toute autre considération.

## Normalisation d'URL

`url.ts` produit une **clé canonique** utilisée uniquement pour regrouper les
doublons. L'URL d'origine n'est jamais réécrite : c'est la donnée de
l'utilisateur, et une normalisation trop agressive serait irréversible.

La clé fusionne volontairement `http`/`https`, `www`/nu, slash final et
paramètres de tracking. Elle préserve les paramètres fonctionnels (`?q=`,
`?page=`) et les routes hashbang (`#!/`), qui désignent des pages réellement
différentes.

## Base de données

Neon Postgres, accédé par Prisma 7 avec le driver adapter `pg`.

Deux chaînes de connexion, non interchangeables. Elles ne diffèrent que par le
suffixe `-pooler` du nom d'hôte :

- `DATABASE_URL` — hôte en `-pooler`. Utilisé au runtime.
- `DIRECT_URL` — même hôte sans `-pooler`. Utilisée par la CLI Prisma : les
  migrations exigent une session Postgres complète, que le pooler ne fournit
  pas.

Le compute Neon se suspend après cinq minutes d'inactivité et **reprend seul**
à la requête suivante, au prix d'un démarrage à froid de l'ordre d'une
demi-seconde. La première requête après une longue pause est donc lente : à
prendre en compte dans les états de chargement, pas à contourner.

`prisma.config.ts` n'est lu que par la CLI. Le runtime passe par `src/lib/db.ts`.

## Cloisonnement des données

Prisma se connecte en propriétaire de la base, et aucune politique RLS n'est
définie. Le cloisonnement repose donc **entièrement** sur la couche
applicative — chaque requête filtre sur `userId`, sans exception. Il n'existe
aucun filet en dessous.

C'est le point fragile de l'architecture. Toute requête ajoutée doit être
relue sous cet angle.

## Contraintes de plateforme

- **Fonctions Vercel plafonnées à 300 s.** Le health check de plusieurs
  milliers d'URL est découpé en lots d'environ 200, le client pilotant la
  boucle. Le traitement est reprenable.
- **Next 16 remplace `middleware.ts` par `proxy.ts`.** La protection des routes
  s'y branche.
- **Volume visé : quelques milliers de favoris.** L'arbre complet est chargé
  côté client et filtré en mémoire — la recherche est instantanée et il n'y a
  pas de pagination serveur à maintenir.
