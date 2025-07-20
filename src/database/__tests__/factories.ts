import type * as schema from "../schema.js";

/**
 * テスト用のプロジェクトデータファクトリ
 */
export function createTestProject(
	overrides?: Partial<schema.NewProject>,
): schema.NewProject {
	return {
		gitlabId: Math.floor(Math.random() * 10000) + 1,
		name: `Test Project ${Date.now()}`,
		description: "テスト用のプロジェクト",
		webUrl: "https://gitlab.com/test/project",
		defaultBranch: "main",
		visibility: "public",
		gitlabCreatedAt: new Date(),
		gitlabUpdatedAt: new Date(),
		...overrides,
	};
}

/**
 * テスト用のコミットデータファクトリ
 */
export function createTestCommit(
	projectId: number,
	overrides?: Partial<schema.NewCommit>,
): schema.NewCommit {
	const randomSha = Math.random().toString(36).substring(2, 42);
	return {
		projectId,
		sha: randomSha,
		message: "テスト用のコミット",
		authorName: "Test Author",
		authorEmail: "test@example.com",
		authorDate: new Date(),
		committerName: "Test Committer",
		committerEmail: "test@example.com",
		committerDate: new Date(),
		webUrl: `https://gitlab.com/test/project/-/commit/${randomSha}`,
		shortId: randomSha.substring(0, 8),
		title: "テスト用のコミット",
		additions: 10,
		deletions: 5,
		totalChanges: 15,
		...overrides,
	};
}

/**
 * テスト用の同期ログデータファクトリ
 */
export function createTestSyncLog(
	projectId: number,
	overrides?: Partial<schema.NewSyncLog>,
): schema.NewSyncLog {
	return {
		projectId,
		syncType: "incremental",
		status: "completed",
		startedAt: new Date(),
		completedAt: new Date(),
		durationSeconds: 30,
		recordsProcessed: 100,
		recordsAdded: 50,
		recordsUpdated: 50,
		lastCommitSha: "abc123def456",
		lastCommitDate: new Date(),
		...overrides,
	};
}
