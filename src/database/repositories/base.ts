import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../schema.js";

/**
 * ベースリポジトリクラス
 */
export abstract class BaseRepository {
	protected db: NodePgDatabase<typeof schema>;

	constructor(db?: NodePgDatabase<typeof schema>) {
		if (db) {
			this.db = db;
		} else {
			// 同期的に初期化する場合は、initialize()を先に呼び出す必要がある
			throw new Error(
				"Database instance is required. Call initialize() first.",
			);
		}
	}

	/**
	 * トランザクション内でリポジトリインスタンスを作成
	 */
	protected withTransaction(tx: NodePgDatabase<typeof schema>): this {
		const RepositoryClass = this.constructor as new (
			db: NodePgDatabase<typeof schema>,
		) => this;
		return new RepositoryClass(tx);
	}
}
