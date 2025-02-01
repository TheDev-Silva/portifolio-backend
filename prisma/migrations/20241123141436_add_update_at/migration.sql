/*
  Warnings:

  - Added the required column `updatedAt` to the `CaptureClient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CaptureClient" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
