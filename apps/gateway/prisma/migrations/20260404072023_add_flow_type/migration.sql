-- AlterTable
ALTER TABLE "flows" ADD COLUMN     "flowType" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "outputSchema" JSONB NOT NULL DEFAULT '[]';
