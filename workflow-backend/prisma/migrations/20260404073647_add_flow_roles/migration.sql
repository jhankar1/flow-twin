-- AlterTable
ALTER TABLE "flows" ADD COLUMN     "runnableByRoles" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "visibleToRoles" JSONB NOT NULL DEFAULT '[]';
