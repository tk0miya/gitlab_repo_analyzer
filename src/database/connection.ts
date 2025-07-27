import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { loadConfig } from "@/config/index.js";
import * as schema from "./schema/index.js";

// 設定を読み込み
const config = await loadConfig();

// データベース接続プールの設定
const pool = new Pool({
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
export const db = drizzle(pool, { schema });

// 生のPostgreSQLプール（直接SQLクエリが必要な場合）
export { pool };

// データベース接続テスト
export async function testConnection(): Promise<boolean> {
	let client: PoolClient | null = null;
	try {
		client = await pool.connect();
		const result = await client.query("SELECT NOW()");
		console.log("データベース接続成功:", result.rows[0].now);
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
		await pool.end();
		console.log("データベース接続プールを正常に終了しました");
	} catch (error) {
		console.error("データベース接続プール終了エラー:", error);
	}
}
