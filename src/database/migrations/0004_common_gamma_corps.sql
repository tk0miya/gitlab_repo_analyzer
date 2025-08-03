DROP INDEX "sync_logs_project_type_started_idx";--> statement-breakpoint
ALTER TABLE "sync_logs" ALTER COLUMN "completed_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_logs" ALTER COLUMN "records_processed" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_logs" ALTER COLUMN "records_added" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "last_commit_date" timestamp NOT NULL;--> statement-breakpoint
CREATE INDEX "sync_logs_project_type_completed_idx" ON "sync_logs" USING btree ("project_id","sync_type","completed_at");--> statement-breakpoint
ALTER TABLE "sync_logs" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "sync_logs" DROP COLUMN "started_at";--> statement-breakpoint
ALTER TABLE "sync_logs" DROP COLUMN "error_message";--> statement-breakpoint
DROP TYPE "public"."sync_status";