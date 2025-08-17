import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * マージリクエストステータス定義
 */
export const mergeRequestStateEnum = pgEnum("merge_request_state", [
	"opened",
	"closed",
	"merged",
]);

/**
 * GitLabマージリクエスト情報テーブル
 * GitLab APIから取得したマージリクエスト情報を管理
 */
export const mergeRequests = pgTable(
	"merge_requests",
	{
		// 内部ID（プライマリキー）
		id: serial("id").primaryKey(),

		// プロジェクトID（外部キー、必須）
		project_id: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),

		// GitLab マージリクエストIID（必須）
		gitlab_iid: integer("gitlab_iid").notNull(),

		// GitLab マージリクエストID（必須）
		gitlab_id: integer("gitlab_id").notNull(),

		// タイトル（必須）
		title: varchar("title", { length: 500 }).notNull(),

		// 説明（任意）
		description: text("description"),

		// ステータス（必須）
		state: mergeRequestStateEnum("state").notNull(),

		// 作者ID（GitLabユーザーID、必須）
		author_id: integer("author_id").notNull(),

		// 作者名（必須）
		author_name: varchar("author_name", { length: 255 }).notNull(),

		// 作者ユーザー名（必須）
		author_username: varchar("author_username", { length: 255 }).notNull(),

		// ソースブランチ（必須）
		source_branch: varchar("source_branch", { length: 255 }).notNull(),

		// ターゲットブランチ（必須）
		target_branch: varchar("target_branch", { length: 255 }).notNull(),

		// WebURL（必須）
		web_url: varchar("web_url", { length: 500 }).notNull(),

		// GitLab上での作成日時（必須）
		gitlab_created_at: timestamp("gitlab_created_at").notNull(),

		// GitLab上での更新日時（必須）
		gitlab_updated_at: timestamp("gitlab_updated_at").notNull(),

		// マージ日時（マージされた場合のみ）
		merged_at: timestamp("merged_at"),

		// クローズ日時（クローズされた場合のみ）
		closed_at: timestamp("closed_at"),

		// 内部作成日時
		created_at: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		// project_id + gitlab_iid の複合UNIQUE制約（重複防止）
		project_iid_unique: uniqueIndex("merge_requests_project_iid_unique").on(
			table.project_id,
			table.gitlab_iid,
		),

		// gitlab_id でのUNIQUE制約
		gitlab_id_unique: uniqueIndex("merge_requests_gitlab_id_unique").on(
			table.gitlab_id,
		),

		// プロジェクトIDでの検索用インデックス
		project_id_idx: index("merge_requests_project_id_idx").on(table.project_id),

		// 作者での検索用インデックス
		author_username_idx: index("merge_requests_author_username_idx").on(
			table.author_username,
		),

		// ステータスでの検索用インデックス
		state_idx: index("merge_requests_state_idx").on(table.state),

		// 作成日時での検索用インデックス
		gitlab_created_at_idx: index("merge_requests_gitlab_created_at_idx").on(
			table.gitlab_created_at,
		),

		// 更新日時での検索用インデックス
		gitlab_updated_at_idx: index("merge_requests_gitlab_updated_at_idx").on(
			table.gitlab_updated_at,
		),
	}),
);

/**
 * マージリクエストテーブルの型定義
 */
export type MergeRequest = typeof mergeRequests.$inferSelect;
export type NewMergeRequest = typeof mergeRequests.$inferInsert;

/**
 * マージリクエストステータスの型定義
 */
export type MergeRequestState =
	(typeof mergeRequestStateEnum.enumValues)[number];

/**
 * マージリクエストステータス定数
 */
export const MERGE_REQUEST_STATES = {
	OPENED: "opened",
	CLOSED: "closed",
	MERGED: "merged",
} as const;
