import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * プロジェクト情報テーブル
 */
export const projects = pgTable(
	"projects",
	{
		id: serial("id").primaryKey(),
		gitlabId: integer("gitlab_id").unique().notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		webUrl: varchar("web_url", { length: 500 }),
		defaultBranch: varchar("default_branch", { length: 100 }),
		visibility: varchar("visibility", { length: 20 }), // public, internal, private
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
		gitlabCreatedAt: timestamp("gitlab_created_at"),
		gitlabUpdatedAt: timestamp("gitlab_updated_at"),
	},
	(table) => ({
		gitlabIdIdx: index("idx_projects_gitlab_id").on(table.gitlabId),
		nameIdx: index("idx_projects_name").on(table.name),
		visibilityIdx: index("idx_projects_visibility").on(table.visibility),
	}),
);

/**
 * コミット情報テーブル
 */
export const commits = pgTable(
	"commits",
	{
		id: serial("id").primaryKey(),
		projectId: integer("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		sha: varchar("sha", { length: 40 }).notNull(),
		message: text("message").notNull(),
		authorName: varchar("author_name", { length: 255 }).notNull(),
		authorEmail: varchar("author_email", { length: 255 }).notNull(),
		authorDate: timestamp("author_date").notNull(),
		committerName: varchar("committer_name", { length: 255 }),
		committerEmail: varchar("committer_email", { length: 255 }),
		committerDate: timestamp("committer_date"),
		webUrl: varchar("web_url", { length: 500 }),
		shortId: varchar("short_id", { length: 8 }),
		title: varchar("title", { length: 500 }),
		additions: integer("additions").default(0),
		deletions: integer("deletions").default(0),
		totalChanges: integer("total_changes").default(0),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		projectIdIdx: index("idx_commits_project_id").on(table.projectId),
		shaIdx: index("idx_commits_sha").on(table.sha),
		authorEmailIdx: index("idx_commits_author_email").on(table.authorEmail),
		authorDateIdx: index("idx_commits_author_date").on(table.authorDate),
		projectAuthorDateIdx: index("idx_commits_project_author_date").on(
			table.projectId,
			table.authorDate,
		),
		projectShaUnique: unique("idx_commits_project_sha").on(
			table.projectId,
			table.sha,
		),
	}),
);

/**
 * 同期ログテーブル
 */
export const syncLogs = pgTable(
	"sync_logs",
	{
		id: serial("id").primaryKey(),
		projectId: integer("project_id")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		syncType: varchar("sync_type", { length: 50 }).notNull(), // 'full', 'incremental', 'commits', 'branches'
		status: varchar("status", { length: 20 }).notNull(), // 'pending', 'running', 'completed', 'failed'
		startedAt: timestamp("started_at").defaultNow(),
		completedAt: timestamp("completed_at"),
		durationSeconds: integer("duration_seconds"),
		recordsProcessed: integer("records_processed").default(0),
		recordsAdded: integer("records_added").default(0),
		recordsUpdated: integer("records_updated").default(0),
		errorMessage: text("error_message"),
		lastCommitSha: varchar("last_commit_sha", { length: 40 }),
		lastCommitDate: timestamp("last_commit_date"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		projectIdIdx: index("idx_sync_logs_project_id").on(table.projectId),
		statusIdx: index("idx_sync_logs_status").on(table.status),
		syncTypeIdx: index("idx_sync_logs_sync_type").on(table.syncType),
		startedAtIdx: index("idx_sync_logs_started_at").on(table.startedAt),
		projectStatusIdx: index("idx_sync_logs_project_status").on(
			table.projectId,
			table.status,
		),
	}),
);

// 型定義のエクスポート
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
