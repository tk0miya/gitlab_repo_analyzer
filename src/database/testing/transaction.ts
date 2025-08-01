import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/database/schema/index";

// トランザクション型のエイリアス
type Transaction = Parameters<
	Parameters<NodePgDatabase<typeof schema>["transaction"]>[0]
>[0];

/**
 * トランザクション内でコードを実行し、自動的にロールバックするユーティリティ関数
 * テストや一時的な操作で使用する
 */
export async function withTransaction<T>(
	testFn: (tx: Transaction) => Promise<T>,
): Promise<T> {
	const { getDb } = await import("@/database/connection");
	const db = await getDb();

	let result: T | undefined;
	let hasResult = false;

	await db
		.transaction(async (tx) => {
			result = await testFn(tx as Transaction);
			hasResult = true;
			// トランザクションを強制的にロールバック
			throw new Error("Transaction rollback");
		})
		.catch((error: Error) => {
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
