import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach } from "vitest";
import * as schema from "../../src/database/schema.js";
import { commits, projects, syncLogs } from "../../src/database/schema.js";

let pool: Pool;
let testDb: NodePgDatabase<typeof schema>;

/**
 * テストデータベースのセットアップ
 */
export async function setupTestDatabase(): Promise<
	NodePgDatabase<typeof schema>
> {
	if (!testDb) {
		pool = new Pool({
			host: process.env.DB_HOST || "localhost",
			port: Number.parseInt(process.env.DB_PORT || "5432"),
			user: process.env.DB_USERNAME || "test_user",
			password: process.env.DB_PASSWORD || "test_password",
			database: process.env.DB_DATABASE || "gitlab_analyzer_test",
			ssl: process.env.DB_SSL === "true",
		});

		testDb = drizzle(pool, { schema });

		// マイグレーションを実行
		await migrate(testDb, {
			migrationsFolder: "./src/database/migrations",
		});
	}

	// 各テスト前にデータをクリーンアップ
	await testDb.delete(commits);
	await testDb.delete(syncLogs);
	await testDb.delete(projects);

	return testDb;
}

/**
 * テストデータベースの終了処理
 */
export async function cleanupTestDatabase(): Promise<void> {
	if (pool) {
		await pool.end();
	}
}

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

/**
 * 各テストスイートでのベースセットアップ
 */
export function setupDatabaseTest() {
	let db: NodePgDatabase<typeof schema>;

	beforeAll(async () => {
		db = await setupTestDatabase();
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	beforeEach(async () => {
		db = await setupTestDatabase();
	});

	return () => db;
}
