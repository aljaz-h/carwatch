-- CreateEnum
CREATE TYPE "ScrapeRunTrigger" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProviderErrorType" AS ENUM ('DNS_FAILURE', 'CONNECTION_TIMEOUT', 'REQUEST_TIMEOUT', 'HTTP_FORBIDDEN', 'HTTP_RATE_LIMITED', 'HTTP_ERROR', 'PARSER_STRUCTURE_MISMATCH', 'PARSER_ANOMALY', 'UNEXPECTED_RESPONSE', 'DATABASE_ERROR', 'NORMALIZATION_ERROR', 'INTERNAL_ERROR');

-- AlterEnum
ALTER TYPE "ScrapeRunStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "provider_scrape_runs" ADD COLUMN     "errorDetail" TEXT,
ADD COLUMN     "errorType" "ProviderErrorType",
ADD COLUMN     "httpStatus" INTEGER,
ADD COLUMN     "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "logs" JSONB,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trigger" "ScrapeRunTrigger" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "provider_scrape_runs_providerId_status_idx" ON "provider_scrape_runs"("providerId", "status");
