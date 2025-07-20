CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"gitlab_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"web_url" varchar(500) NOT NULL,
	"default_branch" varchar(255) NOT NULL,
	"visibility" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"gitlab_created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "projects_gitlab_id_unique" ON "projects" USING btree ("gitlab_id");--> statement-breakpoint
CREATE INDEX "projects_name_idx" ON "projects" USING btree ("name");