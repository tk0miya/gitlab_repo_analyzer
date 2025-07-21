// データベースエラークラスの統合エクスポート

export { ConnectionError } from "./ConnectionError.js";
export { DatabaseError } from "./DatabaseError.js";
export { UniqueConstraintError } from "./UniqueConstraintError.js";

import { ConnectionError } from "./ConnectionError.js";
import { DatabaseError } from "./DatabaseError.js";
import { UniqueConstraintError } from "./UniqueConstraintError.js";

/**
 * PostgreSQLエラーを適切なDatabaseErrorサブクラスに変換する
 */
export function handleDatabaseError(error: unknown): DatabaseError {
	if (error && typeof error === "object") {
		const pgError = error as any;

		// PostgreSQLエラーコードに基づく基本分類
		if (pgError.code === "23505") {
			// unique_violation
			return new UniqueConstraintError("重複データエラー", pgError);
		}

		// 接続エラー（08xxxシリーズ）
		if (pgError.code?.startsWith("08")) {
			return new ConnectionError("データベース接続エラー", pgError);
		}
	}

	// その他のエラー
	return new DatabaseError("データベースエラー", error);
}
