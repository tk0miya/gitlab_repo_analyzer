import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../schema.js";

let pool: Pool;
let testDb: NodePgDatabase<typeof schema>;

/**
 * データベースの初期化（一度だけ実行）
 */
export async function initializeTestDatabase(): Promise<
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

		// マイグレーションを実行（一度だけ）
		await migrate(testDb, {
			migrationsFolder: "./src/database/migrations",
		});
	}

	return testDb;
}

/**
 * 高速テストセットアップ（トランザクション使用）
 * @deprecated この関数は後方互換性のために残されています。新しいコードでは initializeTestDatabase() を使用してください。
 */
export async function setupTestDatabase(): Promise<
	NodePgDatabase<typeof schema>
> {
	return await initializeTestDatabase();
}

/**
 * テストデータベースの終了処理
 */
export async function cleanupTestDatabase(): Promise<void> {
	if (pool) {
		await pool.end();
	}
}
