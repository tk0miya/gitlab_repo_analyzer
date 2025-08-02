import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadConfig } from "@/config/index";
import * as schema from "./schema/index";

// 遅延初期化用の変数
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// データベース接続型のエイリアス
export type DbConnection = ReturnType<typeof drizzle<typeof schema>>;

// トランザクション型のエイリアス
export type Transaction = Parameters<
	Parameters<DbConnection["transaction"]>[0]
>[0];

// データベース実行コンテキストの型（通常の接続またはトランザクション）
export type DatabaseContext = DbConnection | Transaction;

// AsyncLocalStorageを使用して現在のトランザクションを管理
const transactionContext = new AsyncLocalStorage<DatabaseContext>();

/**
 * データベース接続を初期化（遅延初期化）
 */
async function initializeDatabase() {
	// 設定を読み込み
	const config = await loadConfig();

	// データベース接続プールの設定
	_pool = new Pool({
		host: config.database.host,
		port: config.database.port,
		user: config.database.username,
		password: config.database.password || "",
		database: config.database.database,
		ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
		max: 20, // プール内の最大接続数
		idleTimeoutMillis: 30000, // アイドル接続のタイムアウト
		connectionTimeoutMillis: 2000, // 接続タイムアウト
	});

	// Drizzle ORMインスタンス
	_db = drizzle(_pool, { schema });
}

/**
 * Drizzle ORMインスタンスを取得
 * 現在のトランザクションが存在する場合はそれを優先して返す
 */
export async function getDb(): Promise<DatabaseContext> {
	// 現在のトランザクションを確認
	const currentTransaction = transactionContext.getStore();
	if (currentTransaction) {
		return currentTransaction;
	}

	// 通常のデータベースインスタンスを返す
	if (!_db) {
		await initializeDatabase();
	}
	if (!_db) {
		throw new Error("Failed to initialize database");
	}
	return _db;
}

/**
 * トランザクション内でコードを実行する
 * ネスト可能で、エラーが発生した場合は自動的にロールバックされる
 * トランザクション内では getDb() が透過的にトランザクションを返す
 * @param callback トランザクション内で実行する関数
 */
export async function transaction(
	callback: () => Promise<void>,
): Promise<void> {
	// 現在のトランザクションを取得
	const currentTransaction = transactionContext.getStore();

	if (currentTransaction) {
		// 既存のトランザクションがある場合はネストしたトランザクションとして実行
		await currentTransaction.transaction(async (nestedTx: Transaction) => {
			await transactionContext.run(nestedTx, async () => {
				await callback();
			});
		});
	} else {
		// 新しいトランザクションを開始
		const db = await getDb();
		await db.transaction(async (tx) => {
			await transactionContext.run(tx, async () => {
				await callback();
			});
		});
	}
}

/**
 * PostgreSQLプールを取得
 */
export async function getPool() {
	if (!_pool) {
		await initializeDatabase();
	}
	if (!_pool) {
		throw new Error("Failed to initialize database pool");
	}
	return _pool;
}

// 正常な終了時の接続プール終了
export async function closeConnection(): Promise<void> {
	try {
		if (_pool) {
			await _pool.end();
			_pool = null;
			_db = null;
		}
	} catch (error) {
		console.error("データベース接続プール終了エラー:", error);
	}
}
