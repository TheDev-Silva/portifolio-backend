/*
  Warnings:

  - Made the column `phone` on table `CaptureCLient` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CaptureCLient" ALTER COLUMN "phone" SET NOT NULL;
