/*
  Warnings:

  - The values [DISPATCHED] on the enum `AlarmStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INVESTIGATING] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AlarmStatus_new" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
ALTER TABLE "alarms" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "alarms" ALTER COLUMN "status" TYPE "AlarmStatus_new" USING ("status"::text::"AlarmStatus_new");
ALTER TYPE "AlarmStatus" RENAME TO "AlarmStatus_old";
ALTER TYPE "AlarmStatus_new" RENAME TO "AlarmStatus";
DROP TYPE "AlarmStatus_old";
ALTER TABLE "alarms" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'COMPLETED');
ALTER TABLE "alarm_reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "alarm_reports" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "ReportStatus_old";
ALTER TABLE "alarm_reports" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
