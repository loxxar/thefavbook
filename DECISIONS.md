# Journal des décisions

Une entrée par décision qui engage la suite. On note le contexte et la raison,
pas seulement le choix — pour pouvoir le remettre en cause plus tard en
connaissance de cause.

---

## 2026-08-12 — Supabase Postgres plutôt que SQLite local

> **Révisée le même jour** — voir « Neon plutôt que Supabase » en fin de
> journal. Le choix d'un Postgres hébergé plutôt que de SQLite tient toujours ;
> seul l'hébergeur change.

**Contexte.** L'outil est mono-utilisateur et manipule une donnée personnelle
(l'historique de navigation en clair). SQLite en fichier local avait été
recommandé : zéro auth à écrire, zéro hébergement, rien qui sorte de la machine.

**Décision.** Supabase Postgres, choix explicite de l'utilisateur.

**Conséquences.** L'authentification devient obligatoire dès le Lot 1, et
`userId` figure sur toutes les tables dès la première migration — l'ajouter
après aurait imposé une migration pénible sur des données réelles.

---

## 2026-08-12 — Next.js 16 plutôt que Next.js 15

**Contexte.** Le référentiel personnel mentionne Next.js 15, mais impose aussi
« dernières versions stables, toujours ». Next 16 est stable.

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

**Contexte.** Demande explicite d'un classement performant et autonome.

**Décision.** Moteur de règles déterministe (domaine, TLD, mots-clés) comme
unique mécanisme de classement automatique. Aucun appel à une API de LLM.

**Piste conservée pour le Lot 4.** Les règles couvrent environ 60 à 70 % d'une
collection ; les titres inutiles (`Untitled`, `Home`) et les domaines obscurs
leur échappent. Des embeddings locaux (`transformers.js` sur un petit modèle
ONNX) donneraient un regroupement sémantique réel, hors ligne et sans coût.
Ils ne tiennent pas dans une fonction Vercel : ce serait un script CLI lancé
sur la machine de l'utilisateur, écrivant ses suggestions en base. À décider le
moment venu.

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
projet laissé en pause finit supprimé. Cet outil est personnel et sera utilisé
par à-coups : la pause serait l'état normal, pas l'exception.

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
