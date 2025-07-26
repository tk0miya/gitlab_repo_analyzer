import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/database/schema/index.js";

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
