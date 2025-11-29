CREATE TABLE "promotions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"min_order_value" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"driver_id" varchar,
	"restaurant_rating" integer,
	"restaurant_comment" text,
	"driver_rating" integer,
	"driver_comment" text,
	"food_rating" integer,
	"food_comment" text,
	"delivery_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "printer_webhook_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "printer_webhook_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "printer_webhook_method" text DEFAULT 'POST' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "printer_webhook_secret" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "printer_webhook_events" json DEFAULT '["order.ready", "order.cancelled"]';--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_promotions_tenant" ON "promotions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_promotions_code" ON "promotions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_ratings_order" ON "ratings" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ratings_tenant" ON "ratings" USING btree ("tenant_id");