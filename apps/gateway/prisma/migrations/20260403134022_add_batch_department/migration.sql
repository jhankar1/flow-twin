-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "currentNodeId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_entries" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "fieldValues" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "deptName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_entries" ADD CONSTRAINT "batch_entries_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
