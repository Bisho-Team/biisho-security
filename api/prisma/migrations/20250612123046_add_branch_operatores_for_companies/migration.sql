/*
  Warnings:

  - You are about to drop the `branch_operators` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "branch_operators";

-- CreateTable
CREATE TABLE "CompanyOperator" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyOperator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyOperator_companyId_operatorId_key" ON "CompanyOperator"("companyId", "operatorId");

-- AddForeignKey
ALTER TABLE "CompanyOperator" ADD CONSTRAINT "CompanyOperator_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyOperator" ADD CONSTRAINT "CompanyOperator_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
