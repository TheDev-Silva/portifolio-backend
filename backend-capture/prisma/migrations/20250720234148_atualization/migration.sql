-- CreateEnum
CREATE TYPE "Status" AS ENUM ('CONTACTED', 'CONTACT_SIGNED', 'DROPPED_OUT');

-- CreateTable
CREATE TABLE "CaptureClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'CONTACTED',
    "projectValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,

    CONSTRAINT "CaptureClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaptureClient_email_key" ON "CaptureClient"("email");
