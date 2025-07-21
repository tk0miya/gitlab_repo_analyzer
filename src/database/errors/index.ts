// データベースエラークラスの統合エクスポート

export { ConnectionError } from "./ConnectionError.js";
export { ConstraintViolationError } from "./ConstraintViolationError.js";
export { DatabaseError } from "./DatabaseError.js";
export { TimeoutError } from "./TimeoutError.js";
export { UniqueConstraintError } from "./UniqueConstraintError.js";
export { UnknownDatabaseError } from "./UnknownDatabaseError.js";

import { ConnectionError } from "./ConnectionError.js";
import { ConstraintViolationError } from "./ConstraintViolationError.js";
// Import for internal usage in utility functions
import type { DatabaseError } from "./DatabaseError.js";
import { TimeoutError } from "./TimeoutError.js";
import { UniqueConstraintError } from "./UniqueConstraintError.js";
import { UnknownDatabaseError } from "./UnknownDatabaseError.js";

/**
 * エラーがリトライ可能かどうかを判定するユーティリティ関数
 */
export function isRetryableError(error: unknown): boolean {
	// DatabaseErrorクラスのサブクラスの場合
	if (error && typeof error === "object" && "isRetryable" in error) {
		return (error as any).isRetryable === true;
	}

	// PostgreSQLエラーコードに基づく判定
	if (error && typeof error === "object") {
		const err = error as any;

		if (err.code) {
			const retryableCodes = [
				"08000", // connection_exception
				"08003", // connection_does_not_exist
				"08006", // connection_failure
				"40001", // serialization_failure
				"40P01", // deadlock_detected
				"53000", // insufficient_resources
				"53100", // disk_full
				"53200", // out_of_memory
				"53300", // too_many_connections
				"57014", // query_canceled
			];
			return retryableCodes.includes(err.code);
		}

		// エラー名やメッセージに基づく判定
		const errorName = err.name || "";
		const errorMessage = err.message || "";

		return (
			errorName === "TimeoutError" ||
			errorName === "ConnectionError" ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("connection") ||
			errorMessage.includes("network")
		);
	}

	return false;
}

/**
 * PostgreSQLエラーを適切なDatabaseErrorサブクラスに変換する
 */
export function convertToAppropriateError(
	error: unknown,
	operation?: string,
): DatabaseError {
	if (error && typeof error === "object") {
		const pgError = error as any;

		// PostgreSQLエラーコードに基づく分類
		if (pgError.code) {
			switch (pgError.code) {
				case "23505": // unique_violation
					return new UniqueConstraintError(
						pgError.detail || "Unique constraint violation",
						pgError,
						operation,
					);
				case "23503": // foreign_key_violation
				case "23502": // not_null_violation
				case "23514": // check_violation
					return new ConstraintViolationError(
						pgError.detail || "Constraint violation",
						pgError,
						operation,
					);
				case "08000": // connection_exception
				case "08003": // connection_does_not_exist
				case "08006": // connection_failure
					return new ConnectionError(
						"Database connection error",
						pgError,
						operation,
					);
				case "57014": // query_canceled
					return new TimeoutError("Query timeout", pgError, operation);
				default:
					return new UnknownDatabaseError(
						`Database error (${pgError.code})`,
						pgError,
						operation,
					);
			}
		}

		// タイムアウトエラー
		if (
			pgError.name === "TimeoutError" ||
			pgError.message?.includes("timeout")
		) {
			return new TimeoutError(pgError.message, pgError, operation);
		}

		// 接続エラー
		if (pgError.name === "ConnectionError" || pgError.errno) {
			return new ConnectionError(pgError.message, pgError, operation);
		}
	}

	return new UnknownDatabaseError("Unknown database error", error, operation);
}
