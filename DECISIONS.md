# Journal des décisions

Une entrée par décision qui engage la suite. On note le contexte et la raison,
pas seulement le choix — pour pouvoir le remettre en cause plus tard en
connaissance de cause.

---

## 2026-08-12 — Supabase Postgres plutôt que SQLite local

> **Révisée le même jour** — voir « Neon plutôt que Supabase » en fin de
> journal. Le choix d'un Postgres hébergé plutôt que de SQLite tient toujours ;
> seul l'hébergeur change.

**Contexte.** L'outil manipule une donnée sensible : la liste des sites qu'une
personne fréquente. SQLite en fichier local évitait toute authentification et
tout hébergement, mais interdisait l'accès depuis plusieurs machines.

**Décision.** Un Postgres hébergé.

**Conséquences.** L'authentification devient obligatoire dès le Lot 1, et
`userId` figure sur toutes les tables dès la première migration — l'ajouter
après aurait imposé une migration pénible sur des données réelles.

---

## 2026-08-12 — Next.js 16 plutôt que Next.js 15

**Contexte.** La documentation la plus répandue vise encore Next.js 15. La 16
est stable, et la règle du projet est de partir sur la dernière version stable.

**Décision.** Next.js 16.3.

**Conséquences.** `middleware.ts` devient `proxy.ts`. Les Cache Components et le
PPR changent la façon d'écrire le data fetching. À vérifier au cas par cas
plutôt qu'à appliquer par réflexe.

---

## 2026-08-12 — Prisma 7 avec driver adapter

**Contexte.** Prisma 7 abandonne le moteur Rust embarqué au profit de driver
adapters, déplace l'URL de la datasource dans `prisma.config.ts`, et impose un
chemin de sortie explicite pour le client généré.

**Décision.** Générateur `prisma-client` vers `src/generated/prisma`, adapter
`@prisma/adapter-pg` sur `pg`.

**Conséquences.** Le client s'importe depuis `@/generated/prisma/client`, pas
depuis `@prisma/client`. Le dossier généré n'est pas versionné : `pnpm install`
doit être suivi de `pnpm db:generate`.

---

## 2026-08-12 — Parsing par flux d'événements, pas par arbre DOM

**Contexte.** Le Netscape Bookmark File Format laisse `<DT>`, `<DD>` et `<p>`
non fermés. Chaque parseur HTML reconstruit une hiérarchie différente, et donc
non fiable.

**Décision.** Parcours événementiel `htmlparser2` avec une pile de `<DL>`,
l'arbre reconstruit étant ignoré.

**Alternative écartée.** `cheerio` et consorts : lisibles sur du HTML propre,
mais ils s'appuient précisément sur la hiérarchie réparée dont on se méfie.

---

## 2026-08-12 — `canonicalUrl` stockée mais non indexée

**Contexte.** La clé de dédoublonnage est du texte libre. Un index btree
Postgres plafonne à environ 2704 octets par entrée, et une URL peut dépasser
cette limite — l'insertion échouerait à l'exécution.

**Décision.** Colonne `@db.Text` sans index.

**Raison.** À l'échelle visée (quelques milliers de lignes), le parcours
séquentiel est sans effet mesurable. Stocker un hash uniquement pour pouvoir
indexer serait de la complexité sans contrepartie.

**À revoir si** le volume dépasse quelques centaines de milliers de favoris.

---

## 2026-08-12 — Classement par règles, IA écartée du chemin principal

> **Renversée** — voir « Classement par modèle de langage » en fin de journal.
> L'analyse des limites d'un moteur de règles reste valable : c'est elle qui a
> conduit au renversement.

**Contexte.** Un classement automatique était attendu, sans dépendance externe.

**Décision.** Moteur de règles déterministe (domaine, TLD, mots-clés) comme
unique mécanisme de classement. Aucun appel à une API de modèle de langage.

**Limite identifiée.** Les règles couvrent environ 60 à 70 % d'une collection.
Les titres inutiles (`Untitled`, `Home`) et les domaines obscurs leur
échappent.

---

## 2026-08-12 — Favicons inline non conservés

**Contexte.** L'attribut `ICON` des exports contient le favicon en data: URI.
Sur quelques milliers de favoris, cela représente plusieurs Mo.

**Décision.** Les data: URI sont lus par le parseur mais ne sont pas persistés,
et l'export ne les réémet pas par défaut (`includeIcons: false`).

**Raison.** Le navigateur retélécharge les favicons à la réimportation : le
gain est nul et le coût de stockage réel. L'option reste disponible pour le
test de round-trip, qui exige une restitution à l'identique.

---

## 2026-08-12 — Neon plutôt que Supabase

**Contexte.** Sur l'offre gratuite, Supabase met un projet en pause après sept
jours de faible activité. La reprise est **manuelle** depuis le dashboard, et un
projet laissé en pause finit supprimé. L'outil est utilisé par à-coups : la
pause serait l'état normal, pas l'exception.

**Décision.** Neon Postgres.

**Raison.** La différence n'est pas la générosité du palier gratuit mais le
modèle de suspension. Neon suspend le compute après cinq minutes d'inactivité et
le **reprend seul** à la requête suivante, en une demi-seconde environ. Aucune
intervention, aucune suppression pour inactivité.

**Alternative écartée.** Prisma Postgres, pourtant naturelle avec Prisma 7 : son
palier gratuit plafonne à 100 000 opérations par mois. Un import de 5 000
favoris en consomme autant d'écritures d'un coup, et la mise au point du Lot 1
suppose de réimporter souvent. Neon ne facture que le temps de compute
réellement consommé.

**Écartée aussi.** Maintenir Supabase éveillé par un cron `pg_cron` ou une
GitHub Action qui ping la base : c'est payer du compute pour simuler une
activité qui n'existe pas, afin de contourner un comportement voulu par
l'hébergeur.

**Conséquences.**

- Aucun changement de code : `@prisma/adapter-pg` parle à n'importe quel
  Postgres. Seules les deux URL changent, et elles ne diffèrent entre elles que
  par le suffixe `-pooler` du nom d'hôte.
- Les politiques RLS n'existent plus, même en théorie. Le filtrage sur `userId`
  devient l'unique barrière de cloisonnement — voir ARCHITECTURE.md.
- Le démarrage à froid après suspension est à assumer dans les états de
  chargement de l'interface.
- `sslmode=verify-full` est écrit explicitement dans les URL : `pg` traite
  aujourd'hui `require` comme `verify-full` mais s'apprête à basculer sur la
  sémantique libpq, plus permissive.

---

## 2026-08-14 — Classement par modèle de langage

**Contexte.** Le moteur de règles échouait précisément là où le besoin est le
plus fort : titres inexploitables, domaines inconnus, regroupements qui
demandent de comprendre le sujet plutôt que de reconnaître un motif.

**Décision.** Classement par modèle de langage, via OpenRouter.

**Cadre, non négociable.** Seuls le titre et l'adresse sortent, jamais le
contenu des pages. Rien ne part sans consentement explicite, vérifié aussi côté
serveur. Chaque requête porte `data_collection: deny`, qui écarte du routage les
fournisseurs s'autorisant l'entraînement sur les requêtes.

**Le modèle propose, l'utilisateur arbitre.** Les affectations restent en
attente dans `Suggestion` ; rien ne bouge avant acceptation. Un classement de
plusieurs milliers de favoris qu'on ne peut pas relire est un classement qu'on
ne peut pas corriger.

**Alternative écartée.** L'API Google en direct : son palier gratuit se ferme
sans prévenir, et un service qui s'interrompt sans préavis ne peut pas porter
une fonctionnalité centrale.

**Alternative écartée.** DeepSeek : serveurs en Chine, entraînement sur les
entrées par défaut, aucune politique de rétention publiée. Incompatible avec les
garanties données sur la page de confidentialité.
