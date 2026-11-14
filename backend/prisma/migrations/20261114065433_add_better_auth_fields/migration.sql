-- AlterTable
ALTER TABLE "platform_accounts" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "access_token_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "id_token" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "refresh_token_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "scope" TEXT;

-- AlterTable
ALTER TABLE "platform_sessions" ALTER COLUMN "absolute_expires_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "platform_users" ADD COLUMN     "image" TEXT,
ALTER COLUMN "kind" SET DEFAULT 'platform_admin';

-- CreateIndex
CREATE INDEX "platform_verifications_identifier_idx" ON "platform_verifications"("identifier");
