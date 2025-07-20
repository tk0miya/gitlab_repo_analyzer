CREATE TABLE "commits" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"sha" varchar(40) NOT NULL,
	"message" text NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"author_email" varchar(255) NOT NULL,
	"author_date" timestamp NOT NULL,
	"additions" integer,
	"deletions" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commits_project_sha_unique" ON "commits" USING btree ("project_id","sha");--> statement-breakpoint
CREATE INDEX "commits_project_id_idx" ON "commits" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "commits_author_email_idx" ON "commits" USING btree ("author_email");--> statement-breakpoint
CREATE INDEX "commits_author_date_idx" ON "commits" USING btree ("author_date");