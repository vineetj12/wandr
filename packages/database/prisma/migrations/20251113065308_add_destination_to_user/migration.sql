/*
  Warnings:

  - You are about to drop the column `destination` on the `location` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "location" DROP COLUMN "destination";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "destination" TEXT;
