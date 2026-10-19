/*
  Warnings:

  - A unique constraint covering the columns `[alarmCode]` on the table `alarms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alarmCode` to the `alarms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "alarms" ADD COLUMN     "alarmCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "alarms_alarmCode_key" ON "alarms"("alarmCode");
