import { DatabaseError } from "./DatabaseError.js";

/**
 * データベース接続エラー
 * ネットワーク問題や接続プール不足など、接続に関連するエラー
 */
export class ConnectionError extends DatabaseError {
	constructor(
		message: string = "Database connection error",
		originalError?: unknown,
	) {
		super(message, originalError);
	}
}
