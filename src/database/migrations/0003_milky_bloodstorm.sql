DROP INDEX "sync_logs_project_type_idx";--> statement-breakpoint
CREATE INDEX "sync_logs_project_type_started_idx" ON "sync_logs" USING btree ("project_id","sync_type","started_at");