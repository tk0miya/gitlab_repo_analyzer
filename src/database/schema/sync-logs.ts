import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * 同期タイプ定義
 */
export const syncTypeEnum = pgEnum("sync_type", ["projects", "commits"]);

/**
 * 同期履歴管理テーブル
 * GitLabリポジトリとの同期処理履歴を管理
 */
export const syncLogs = pgTable(
	"sync_logs",
	{
		// 内部ID（プライマリキー）
		id: serial("id").primaryKey(),

		// プロジェクトID（外部キー、必須）
		project_id: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),

		// 同期タイプ（必須）
		sync_type: syncTypeEnum("sync_type").notNull(),

		// 同期完了日時（必須）
		completed_at: timestamp("completed_at").notNull(),

		// 処理レコード数（必須）
		records_processed: integer("records_processed").notNull(),

		// 追加レコード数（必須）
		records_added: integer("records_added").notNull(),

		// 最後に処理したコミットの日時（必須、コミット同期時に使用）
		last_commit_date: timestamp("last_commit_date").notNull(),

		// 内部作成日時
		created_at: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		// プロジェクト + タイプ + 完了日時での検索・ソート用複合インデックス
		project_type_completed_idx: index(
			"sync_logs_project_type_completed_idx",
		).on(table.project_id, table.sync_type, table.completed_at),
	}),
);

/**
 * 同期ログテーブルの型定義
 */
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;

/**
 * 同期タイプの型定義
 */
export type SyncType = (typeof syncTypeEnum.enumValues)[number];

/**
 * 同期タイプ定数
 */
export const SYNC_TYPES = {
	PROJECTS: "projects",
	COMMITS: "commits",
} as const;
