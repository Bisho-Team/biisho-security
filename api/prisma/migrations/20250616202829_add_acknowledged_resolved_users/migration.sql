-- AlterTable
ALTER TABLE "alarm_reports" ADD COLUMN     "acknowledgedById" TEXT,
ADD COLUMN     "resolvedById" TEXT;

-- AddForeignKey
ALTER TABLE "alarm_reports" ADD CONSTRAINT "alarm_reports_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_reports" ADD CONSTRAINT "alarm_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
