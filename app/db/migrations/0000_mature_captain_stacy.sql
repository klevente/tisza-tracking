CREATE TABLE IF NOT EXISTS "members" (
	"recorded_at" timestamp with time zone PRIMARY KEY DEFAULT now() NOT NULL,
	"member_count" integer NOT NULL
);
