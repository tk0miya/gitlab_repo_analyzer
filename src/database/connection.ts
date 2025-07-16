import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadConfig } from "../config/loader.js";
import * as schema from "./schema.js";

let pool: Pool;
let db: NodePgDatabase<typeof schema>;

/**
 * データベースプールの初期化
 */
export async function initializeDatabase(): Promise<
	NodePgDatabase<typeof schema>
> {
	if (db) {
		return db;
	}

	const config = await loadConfig();

	pool = new Pool({
		host: config.database.host,
		port: config.database.port,
		user: config.database.username,
		password: config.database.password,
		database: config.database.database,
		ssl: config.database.ssl,
		// コネクションプール設定
		min: 2,
		max: 10,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000,
	});

	db = drizzle(pool, { schema });

	return db;
}

/**
 * データベースインスタンスの取得
 */
export async function getDatabase(): Promise<NodePgDatabase<typeof schema>> {
	if (!db) {
		return await initializeDatabase();
	}
	return db;
}

/**
 * データベース接続の終了
 */
export async function closeDatabase(): Promise<void> {
	if (pool) {
		await pool.end();
	}
}

/**
 * トランザクションの実行
 */
export async function transaction<T>(
	callback: (tx: NodePgDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
	const database = await getDatabase();
	return database.transaction(callback);
}

/**
 * データベース接続の健全性チェック
 */
export async function healthCheck(): Promise<boolean> {
	try {
		const database = await getDatabase();
		await database.execute("SELECT 1");
		return true;
	} catch (error) {
		console.error("Database health check failed:", error);
		return false;
	}
}
