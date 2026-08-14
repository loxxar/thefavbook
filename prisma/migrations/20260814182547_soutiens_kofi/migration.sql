-- CreateTable
CREATE TABLE "Support" (
    "id" TEXT NOT NULL,
    "kofiTransactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "fromName" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Support_kofiTransactionId_key" ON "Support"("kofiTransactionId");

-- CreateIndex
CREATE INDEX "Support_createdAt_idx" ON "Support"("createdAt");
