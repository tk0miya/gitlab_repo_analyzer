import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

/**
 * GitLabコミット情報テーブル
 * GitLab APIから取得したコミット情報を管理
 */
export const commits = pgTable(
	"commits",
	{
		// 内部ID（プライマリキー）
		id: serial("id").primaryKey(),

		// プロジェクトID（外部キー、必須）
		project_id: integer("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),

		// GitLabコミットSHA（必須）
		sha: varchar("sha", { length: 40 }).notNull(),

		// コミットメッセージ（必須）
		message: text("message").notNull(),

		// 作者名（必須）
		author_name: varchar("author_name", { length: 255 }).notNull(),

		// 作者メールアドレス（必須）
		author_email: varchar("author_email", { length: 255 }).notNull(),

		// 作者日時（GitLab上での authored_date）
		author_date: timestamp("author_date").notNull(),

		// 追加行数（任意）
		additions: integer("additions"),

		// 削除行数（任意）
		deletions: integer("deletions"),

		// 内部作成日時
		created_at: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		// project_id + sha の複合UNIQUE制約（重複防止）
		project_sha_unique: uniqueIndex("commits_project_sha_unique").on(
			table.project_id,
			table.sha,
		),

		// プロジェクトIDでの検索用インデックス
		project_id_idx: index("commits_project_id_idx").on(table.project_id),

		// 作者での検索用インデックス
		author_email_idx: index("commits_author_email_idx").on(table.author_email),

		// 日付での検索用インデックス
		author_date_idx: index("commits_author_date_idx").on(table.author_date),
	}),
);

/**
 * コミットテーブルの型定義
 */
export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
