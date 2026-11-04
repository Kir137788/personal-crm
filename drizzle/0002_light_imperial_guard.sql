CREATE TABLE "contact_group_memberships" (
	"contact_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "contact_group_memberships_contact_id_group_id_pk" PRIMARY KEY("contact_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "contact_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_group_memberships" ADD CONSTRAINT "contact_group_memberships_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_group_memberships" ADD CONSTRAINT "contact_group_memberships_group_id_contact_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."contact_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_group_memberships_group_idx" ON "contact_group_memberships" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_groups_normalized_name_idx" ON "contact_groups" USING btree ("normalized_name");