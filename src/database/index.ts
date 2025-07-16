// スキーマのエクスポート

// 接続関連のエクスポート
export {
	closeDatabase,
	getDatabase,
	healthCheck,
	initializeDatabase,
	transaction,
} from "./connection.js";
// マイグレーション関連のエクスポート
export {
	runMigrations,
	runMigrationsWithErrorHandling,
} from "./migrate.js";

// リポジトリのエクスポート
export {
	BaseRepository,
	CommitRepository,
	ProjectRepository,
	Repositories,
	SyncLogRepository,
} from "./repositories/index.js";
export * from "./schema.js";

// 便利なファクトリー関数
import { Repositories } from "./repositories/index.js";

/**
 * リポジトリインスタンスの取得
 */
export async function getRepositories(): Promise<Repositories> {
	return await Repositories.create();
}

/**
 * データベースの初期化とヘルスチェック
 */
export async function initializeAndCheck(): Promise<boolean> {
	try {
		const { initializeDatabase, healthCheck } = await import("./connection.js");
		await initializeDatabase();
		return await healthCheck();
	} catch (error) {
		console.error("Database initialization failed:", error);
		return false;
	}
}
