-- DATABASE.md 4.2 businesses. Hand-written part: the near_expiry_days check, which Prisma
-- cannot express. rounding_method is added in a later migration (Pending OQ-2).

-- CreateEnum
CREATE TYPE "business_status" AS ENUM ('active', 'suspended');

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "business_status" NOT NULL DEFAULT 'active',
    "status_reason" TEXT,
    "status_changed_by" UUID,
    "currency_code" CHAR(3) NOT NULL,
    "locale" TEXT NOT NULL,
    "time_zone" TEXT NOT NULL,
    "near_expiry_days" INTEGER NOT NULL,
    "invoice_name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "tax_registration_no" TEXT,
    "logo_storage_key" TEXT,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "businesses_near_expiry_days_check" CHECK ("near_expiry_days" > 0)
);

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_status_changed_by_fkey" FOREIGN KEY ("status_changed_by") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
