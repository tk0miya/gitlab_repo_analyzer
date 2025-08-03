DROP INDEX "sync_logs_project_type_completed_idx";--> statement-breakpoint
CREATE INDEX "sync_logs_project_type_created_idx" ON "sync_logs" USING btree ("project_id","sync_type","created_at");--> statement-breakpoint
ALTER TABLE "sync_logs" DROP COLUMN "completed_at";--> statement-breakpoint
ALTER TABLE "sync_logs" DROP COLUMN "records_processed";--> statement-breakpoint
ALTER TABLE "sync_logs" DROP COLUMN "records_added";