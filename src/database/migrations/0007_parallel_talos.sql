ALTER TABLE "commits" RENAME COLUMN "author_date" TO "authored_date";--> statement-breakpoint
DROP INDEX "commits_author_date_idx";--> statement-breakpoint
CREATE INDEX "commits_authored_date_idx" ON "commits" USING btree ("authored_date");