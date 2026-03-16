-- CreateTable
CREATE TABLE "page_views" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_logs" (
    "id" SERIAL NOT NULL,
    "trigger" TEXT NOT NULL,
    "cronExpr" TEXT,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ,
    "status" TEXT NOT NULL,
    "articleCount" INTEGER,
    "reportId" INTEGER,
    "error" TEXT,

    CONSTRAINT "pipeline_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_url_idx" ON "page_views"("url");

-- CreateIndex
CREATE INDEX "pipeline_logs_startedAt_idx" ON "pipeline_logs"("startedAt");
