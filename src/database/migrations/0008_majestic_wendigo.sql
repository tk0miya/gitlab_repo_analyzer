CREATE TYPE "public"."merge_request_state" AS ENUM('opened', 'closed', 'merged');--> statement-breakpoint
ALTER TYPE "public"."sync_type" ADD VALUE 'merge_requests';--> statement-breakpoint
CREATE TABLE "merge_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"gitlab_iid" integer NOT NULL,
	"gitlab_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"state" "merge_request_state" NOT NULL,
	"author_id" integer NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"author_username" varchar(255) NOT NULL,
	"source_branch" varchar(255) NOT NULL,
	"target_branch" varchar(255) NOT NULL,
	"web_url" varchar(500) NOT NULL,
	"gitlab_created_at" timestamp NOT NULL,
	"gitlab_updated_at" timestamp NOT NULL,
	"merged_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "merge_requests_project_iid_unique" ON "merge_requests" USING btree ("project_id","gitlab_iid");--> statement-breakpoint
CREATE UNIQUE INDEX "merge_requests_gitlab_id_unique" ON "merge_requests" USING btree ("gitlab_id");--> statement-breakpoint
CREATE INDEX "merge_requests_project_id_idx" ON "merge_requests" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "merge_requests_author_username_idx" ON "merge_requests" USING btree ("author_username");--> statement-breakpoint
CREATE INDEX "merge_requests_state_idx" ON "merge_requests" USING btree ("state");--> statement-breakpoint
CREATE INDEX "merge_requests_gitlab_created_at_idx" ON "merge_requests" USING btree ("gitlab_created_at");--> statement-breakpoint
CREATE INDEX "merge_requests_gitlab_updated_at_idx" ON "merge_requests" USING btree ("gitlab_updated_at");