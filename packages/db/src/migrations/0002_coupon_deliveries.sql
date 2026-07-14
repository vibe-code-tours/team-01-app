-- Custom SQL migration for coupon_deliveries table
-- This was created manually due to drizzle-kit TTY issues in Docker

CREATE TYPE "coupon_delivery_status" AS ENUM ('pending', 'assigned', 'delivered', 'cancelled');

CREATE TABLE "coupon_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "bottle_count" integer NOT NULL,
  "schedule_id" uuid NOT NULL,
  "township_id" uuid NOT NULL,
  "delivery_address" text NOT NULL,
  "contact_phone" varchar(20) NOT NULL,
  "notes" text,
  "status" "coupon_delivery_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
