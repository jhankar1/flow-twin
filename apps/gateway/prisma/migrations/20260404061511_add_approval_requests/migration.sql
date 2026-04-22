-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "fieldValues" JSONB NOT NULL DEFAULT '{}',
    "submittedBy" TEXT NOT NULL,
    "submitterName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedBy" TEXT,
    "deciderName" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);
