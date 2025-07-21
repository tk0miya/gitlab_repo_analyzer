import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
	isRetryableError as checkRetryableError,
	convertToAppropriateError,
} from "../errors/index.js";
import type * as schema from "../schema/index.js";

/**
 * トランザクション内でコードを実行し、自動的にロールバックするユーティリティ関数
 * テストや一時的な操作で使用する
 */
export async function withTransaction<T>(
	testFn: (tx: NodePgDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
	const { db } = await import("../connection.js");

	let result: T | undefined;
	let hasResult = false;

	await db
		.transaction(async (tx) => {
			result = await testFn(tx);
			hasResult = true;
			// トランザクションを強制的にロールバック
			throw new Error("Transaction rollback");
		})
		.catch((error) => {
			// ロールバック用の例外は無視、それ以外は再スロー
			if (error.message !== "Transaction rollback") {
				throw error;
			}
		});

	if (!hasResult) {
		throw new Error("Transaction did not complete successfully");
	}
	return result as T;
}

/**
 * トランザクション内でコードを実行し、成功時にコミット、失敗時にロールバックする
 * 実用的なアプリケーションで使用する
 */
export async function executeInTransaction<T>(
	transactionFn: (tx: NodePgDatabase<typeof schema>) => Promise<T>,
	options?: {
		maxAttempts?: number;
		backoffMs?: number;
	},
): Promise<T> {
	const { db } = await import("../connection.js");
	const { maxAttempts = 1, backoffMs = 1000 } = options || {};

	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await db.transaction(transactionFn);
		} catch (error) {
			lastError = error as Error;

			// リトライ可能なエラーかチェック
			if (attempt < maxAttempts && isRetryableError(error)) {
				await delay(backoffMs * 2 ** (attempt - 1)); // 指数バックオフ
				continue;
			}

			// リトライ不可能またはリトライ回数上限に達した場合
			throw error;
		}
	}

	throw lastError || new Error("Transaction failed after all attempts");
}

/**
 * データベースエラーを処理し、適切なエラータイプに変換する
 */
export async function handleDatabaseError(
	error: unknown,
	operation?: string,
): Promise<never> {
	throw convertToAppropriateError(error, operation);
}

/**
 * エラーがリトライ可能かどうかを判定する
 */
export const isRetryableError = checkRetryableError;

/**
 * 指定されたミリ秒だけ待機する
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * リトライ機能付きでデータベース操作を実行する
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options?: {
		maxAttempts?: number;
		backoffMs?: number;
		onRetry?: (attempt: number, error: unknown) => void;
	},
): Promise<T> {
	const { maxAttempts = 3, backoffMs = 1000, onRetry } = options || {};

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			// 最後の試行の場合、または リトライ不可能なエラーの場合
			if (attempt >= maxAttempts || !isRetryableError(error)) {
				throw error;
			}

			// リトライコールバックがある場合は実行
			onRetry?.(attempt, error);

			// 指数バックオフで待機
			const waitTime = backoffMs * 2 ** (attempt - 1);
			await delay(waitTime);
		}
	}

	throw lastError;
}
