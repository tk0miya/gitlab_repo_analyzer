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

/**
 * GitLabプロジェクト情報テーブル
 * GitLab APIから取得したプロジェクト情報を管理
 */
export const projects = pgTable(
	"projects",
	{
		// 内部ID（プライマリキー）
		id: serial("id").primaryKey(),

		// GitLab プロジェクトID（必須、ユニーク）
		gitlab_id: integer("gitlab_id").notNull(),

		// プロジェクト名（必須）
		name: varchar("name", { length: 255 }).notNull(),

		// プロジェクト説明（任意）
		description: text("description"),

		// プロジェクトのWebURL（必須）
		web_url: varchar("web_url", { length: 500 }).notNull(),

		// デフォルトブランチ（必須）
		default_branch: varchar("default_branch", { length: 255 }).notNull(),

		// 可視性設定（public, internal, private）
		visibility: varchar("visibility", { length: 50 }).notNull(),

		// 内部作成日時
		created_at: timestamp("created_at").defaultNow().notNull(),

		// GitLab上での作成日時
		gitlab_created_at: timestamp("gitlab_created_at").notNull(),
	},
	(table) => ({
		// gitlab_idにユニークインデックス（重複防止）
		gitlab_id_unique: uniqueIndex("projects_gitlab_id_unique").on(
			table.gitlab_id,
		),

		// プロジェクト名での検索用インデックス
		name_idx: index("projects_name_idx").on(table.name),
	}),
);

/**
 * プロジェクトテーブルの型定義
 */
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

/**
 * 統計情報付きプロジェクト型
 * コミット数と最終更新日を含む
 */
export type ProjectWithStats = Project & {
	commitCount: number;
	lastCommitDate: Date | null;
};
