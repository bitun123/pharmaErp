-- DATABASE.md 4.1 platform_users. Hand-written part: the citext extension, which Prisma
-- does not create (case-insensitive email, DATABASE.md 1).
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "platform_user_kind" AS ENUM ('super_admin', 'platform_admin');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'deactivated');

-- CreateTable
CREATE TABLE "platform_users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "kind" "platform_user_kind" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- AddForeignKey
ALTER TABLE "platform_users" ADD CONSTRAINT "platform_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
