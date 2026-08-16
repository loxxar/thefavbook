-- Introduction des espaces.
--
-- La colonne `spaceId` est obligatoire, or les tables contiennent déjà des
-- milliers de lignes. On procède donc en quatre temps : créer la table, donner
-- un espace par défaut à chaque compte, y rattacher l'existant, puis seulement
-- rendre la colonne obligatoire.

-- 1. La table des espaces.
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Space_userId_position_idx" ON "Space"("userId", "position");
CREATE UNIQUE INDEX "Space_userId_name_key" ON "Space"("userId", "name");

ALTER TABLE "Space" ADD CONSTRAINT "Space_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Un espace par défaut pour chaque compte existant.
--    `gen_random_uuid()` vient de pgcrypto, présent en standard sur PostgreSQL 13+.
INSERT INTO "Space" ("id", "userId", "name", "position", "isDefault", "createdAt")
SELECT gen_random_uuid()::text, "id", 'Mes favoris', 0, true, CURRENT_TIMESTAMP
FROM "user";

-- 3. Colonnes d'abord nullables, le temps de les remplir.
ALTER TABLE "Folder" ADD COLUMN "spaceId" TEXT;
ALTER TABLE "Bookmark" ADD COLUMN "spaceId" TEXT;

UPDATE "Folder" f
SET "spaceId" = s."id"
FROM "Space" s
WHERE s."userId" = f."userId" AND s."isDefault" = true;

UPDATE "Bookmark" b
SET "spaceId" = s."id"
FROM "Space" s
WHERE s."userId" = b."userId" AND s."isDefault" = true;

-- 4. Plus aucune ligne vide : la contrainte peut tomber.
ALTER TABLE "Folder" ALTER COLUMN "spaceId" SET NOT NULL;
ALTER TABLE "Bookmark" ALTER COLUMN "spaceId" SET NOT NULL;

ALTER TABLE "Folder" ADD CONSTRAINT "Folder_spaceId_fkey"
  FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_spaceId_fkey"
  FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Index remplacés par leurs équivalents portant l'espace.
DROP INDEX "Bookmark_userId_folderId_position_idx";
DROP INDEX "Folder_userId_parentId_position_idx";

CREATE INDEX "Bookmark_userId_spaceId_folderId_position_idx"
  ON "Bookmark"("userId", "spaceId", "folderId", "position");
CREATE INDEX "Folder_userId_spaceId_parentId_position_idx"
  ON "Folder"("userId", "spaceId", "parentId", "position");
