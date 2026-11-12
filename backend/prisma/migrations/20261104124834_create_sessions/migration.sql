-- DATABASE.md 4.8 sessions. Hand-written part: the check that exactly one subject is set and
-- it matches the realm, which Prisma cannot express. user_id has no foreign key yet; it is
-- added in the migration that creates users. business_id has no foreign key because the
-- document defines none.

-- CreateEnum
CREATE TYPE "session_realm" AS ENUM ('tenant', 'platform');

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "realm" "session_realm" NOT NULL,
    "user_id" UUID,
    "platform_user_id" UUID,
    "business_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "ip_address" INET,
    "user_agent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_subject_matches_realm_check" CHECK (
      ("realm" = 'tenant' AND "user_id" IS NOT NULL AND "platform_user_id" IS NULL)
      OR ("realm" = 'platform' AND "platform_user_id" IS NOT NULL AND "user_id" IS NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_platform_user_id_idx" ON "sessions"("platform_user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_platform_user_id_fkey" FOREIGN KEY ("platform_user_id") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
