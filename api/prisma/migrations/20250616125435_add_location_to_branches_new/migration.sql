/*
  Warnings:

  - You are about to drop the column `longtitude` on the `branches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "branches" DROP COLUMN "longtitude",
ADD COLUMN     "longitude" TEXT;
