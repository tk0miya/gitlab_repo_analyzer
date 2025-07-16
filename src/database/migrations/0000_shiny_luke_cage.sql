CREATE TABLE "commits" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"sha" varchar(40) NOT NULL,
	"message" text NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"author_email" varchar(255) NOT NULL,
	"author_date" timestamp NOT NULL,
	"committer_name" varchar(255),
	"committer_email" varchar(255),
	"committer_date" timestamp,
	"web_url" varchar(500),
	"short_id" varchar(8),
	"title" varchar(500),
	"additions" integer DEFAULT 0,
	"deletions" integer DEFAULT 0,
	"total_changes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "idx_commits_project_sha" UNIQUE("project_id","sha")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"gitlab_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"web_url" varchar(500),
	"default_branch" varchar(100),
	"visibility" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"gitlab_created_at" timestamp,
	"gitlab_updated_at" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "projects_gitlab_id_unique" UNIQUE("gitlab_id")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"duration_seconds" integer,
	"records_processed" integer DEFAULT 0,
	"records_added" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"error_message" text,
	"last_commit_sha" varchar(40),
	"last_commit_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_commits_project_id" ON "commits" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_commits_sha" ON "commits" USING btree ("sha");--> statement-breakpoint
CREATE INDEX "idx_commits_author_email" ON "commits" USING btree ("author_email");--> statement-breakpoint
CREATE INDEX "idx_commits_author_date" ON "commits" USING btree ("author_date");--> statement-breakpoint
CREATE INDEX "idx_commits_project_author_date" ON "commits" USING btree ("project_id","author_date");--> statement-breakpoint
CREATE INDEX "idx_projects_gitlab_id" ON "projects" USING btree ("gitlab_id");--> statement-breakpoint
CREATE INDEX "idx_projects_name" ON "projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_projects_visibility" ON "projects" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_project_id" ON "sync_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_status" ON "sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_sync_type" ON "sync_logs" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_started_at" ON "sync_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_project_status" ON "sync_logs" USING btree ("project_id","status");