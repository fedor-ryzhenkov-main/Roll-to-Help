-- CreateTable
CREATE TABLE "PendingVerification" (
    "id" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingVerification_verificationCode_key" ON "PendingVerification"("verificationCode"); 