import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../schema/index.js";

/**
 * トランザクション内でコードを実行し、成功時にコミット、失敗時にロールバックする
 */
export async function withTransaction<T>(
	transactionFn: (tx: NodePgDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
	const { db } = await import("../connection.js");
	return await db.transaction(transactionFn);
}