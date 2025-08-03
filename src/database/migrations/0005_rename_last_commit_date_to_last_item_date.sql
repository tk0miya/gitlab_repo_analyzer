-- last_commit_dateをlast_item_dateにリネーム
-- コミットだけでなくMRにも対応するための汎用的な名前に変更

ALTER TABLE "sync_logs" RENAME COLUMN "last_commit_date" TO "last_item_date";