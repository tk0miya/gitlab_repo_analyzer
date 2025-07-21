import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { projects } from "./projects.js";

/**
 * 同期タイプ定義
 */
export const syncTypeEnum = pgEnum("sync_type", ["projects", "commits"]);

/**
 * 同期ステータス定義
 */
export const syncStatusEnum = pgEnum("sync_status", [
	"running",
	"completed",
	"failed",
]);

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

		// 同期ステータス（必須）
		status: syncStatusEnum("status").notNull().default("running"),

		// 同期開始日時（必須）
		started_at: timestamp("started_at").notNull(),

		// 同期完了日時（任意、完了時に設定）
		completed_at: timestamp("completed_at"),

		// 処理レコード数（任意）
		records_processed: integer("records_processed"),

		// 追加レコード数（任意）
		records_added: integer("records_added"),

		// エラーメッセージ（任意、失敗時に設定）
		error_message: text("error_message"),

		// 内部作成日時
		created_at: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		// プロジェクト + タイプ + 開始日時での検索・ソート用複合インデックス
		project_type_started_idx: index("sync_logs_project_type_started_idx").on(
			table.project_id,
			table.sync_type,
			table.started_at,
		),
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
 * 同期ステータスの型定義
 */
export type SyncStatus = (typeof syncStatusEnum.enumValues)[number];

/**
 * 同期タイプ定数
 */
export const SYNC_TYPES = {
	PROJECTS: "projects",
	COMMITS: "commits",
} as const;

/**
 * 同期ステータス定数
 */
export const SYNC_STATUSES = {
	RUNNING: "running",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;
