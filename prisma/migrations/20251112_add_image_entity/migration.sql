-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "public"."images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "blob_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."events"
    ADD COLUMN     "image_id" UUID,
    DROP COLUMN    "image_url";

-- AlterTable
ALTER TABLE "public"."users"
    ADD COLUMN     "avatar_image_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_image_id_key" ON "public"."users"("avatar_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_image_id_key" ON "public"."events"("image_id");

-- CreateIndex
CREATE UNIQUE INDEX "images_blob_name_key" ON "public"."images"("blob_name");

-- AddForeignKey
ALTER TABLE "public"."events"
    ADD CONSTRAINT "events_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users"
    ADD CONSTRAINT "users_avatar_image_id_fkey" FOREIGN KEY ("avatar_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

