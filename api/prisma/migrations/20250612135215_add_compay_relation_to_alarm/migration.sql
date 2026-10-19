-- AlterTable
ALTER TABLE "alarms" ADD COLUMN     "companyId" TEXT;

-- AddForeignKey
ALTER TABLE "alarms" ADD CONSTRAINT "alarms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
