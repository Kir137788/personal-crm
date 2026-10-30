CREATE TABLE "contact_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"body" text NOT NULL,
	"occurred_at" timestamp (3) with time zone,
	"legacy" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "contact_interval_days" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "reminder_enabled_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notes_contact_date_idx" ON "contact_notes" USING btree ("contact_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_legacy_idx" ON "contact_notes" USING btree ("contact_id") WHERE "contact_notes"."legacy" = true;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_interval_check" CHECK ("contacts"."contact_interval_days" in (7,30,90,365));--> statement-breakpoint
INSERT INTO contact_notes (contact_id, body, legacy)
SELECT id, notes, true FROM contacts WHERE notes ~ '[^[:space:]]';
--> statement-breakpoint
CREATE FUNCTION sync_legacy_contact_note() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN RETURN NEW; END IF;
  IF NEW.notes ~ '[^[:space:]]' THEN
    INSERT INTO contact_notes (contact_id, body, legacy) VALUES (NEW.id, NEW.notes, true)
    ON CONFLICT (contact_id) WHERE legacy = true DO UPDATE
    SET body = EXCLUDED.body, updated_at = GREATEST(clock_timestamp(), contact_notes.updated_at + interval '1 millisecond')
    WHERE contact_notes.body IS DISTINCT FROM EXCLUDED.body;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER contacts_legacy_note AFTER INSERT OR UPDATE OF notes ON contacts
FOR EACH ROW EXECUTE FUNCTION sync_legacy_contact_note();
