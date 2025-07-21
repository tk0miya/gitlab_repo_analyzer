// データベース統合エクスポート
// このファイルから全てのデータベース機能にアクセス可能

// 接続とコア機能
export { closeConnection, db, pool, testConnection } from "./connection.js";
// エラーハンドリング
export {
	ConnectionError,
	ConstraintViolationError,
	convertToAppropriateError,
	DatabaseError,
	TimeoutError,
	UniqueConstraintError,
	UnknownDatabaseError,
} from "./errors/index.js";

// リポジトリクラス
export {
	CommitsRepository,
	commitsRepository,
	ProjectsRepository,
	projectsRepository,
	SyncLogsRepository,
	syncLogsRepository,
} from "./repositories/index.js";
// スキーマ定義
export * from "./schema/index.js";
// トランザクションユーティリティ
export {
	executeInTransaction,
	handleDatabaseError,
	isRetryableError,
	withRetry,
	withTransaction,
} from "./utils/transaction.js";
