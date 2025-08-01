import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { loadConfig } from "@/config/index";
import * as schema from "./schema/index";

// 遅延初期化用の変数
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

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
 */
export async function getDb() {
	if (!_db) {
		await initializeDatabase();
	}
	return _db!;
}

/**
 * PostgreSQLプールを取得
 */
export async function getPool() {
	if (!_pool) {
		await initializeDatabase();
	}
	return _pool!;
}

// データベース接続テスト
export async function testConnection(): Promise<boolean> {
	let client: PoolClient | null = null;
	try {
		const pool = await getPool();
		client = await pool.connect();
		await client.query("SELECT NOW()");
		return true;
	} catch (error) {
		console.error("データベース接続エラー:", error);
		return false;
	} finally {
		if (client) {
			client.release();
		}
	}
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
