import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getDb } from "@/database/connection";
import type * as schema from "@/database/schema/index";

/**
 * リポジトリの基底クラス
 * データベース接続の遅延初期化を提供
 */
export abstract class BaseRepository {
	private db?: NodePgDatabase<typeof schema>;

	constructor(database?: NodePgDatabase<typeof schema>) {
		this.db = database;
	}

	/**
	 * データベースインスタンスを取得
	 */
	protected async getDatabase(): Promise<NodePgDatabase<typeof schema>> {
		if (!this.db) {
			this.db = (await getDb()) as unknown as NodePgDatabase<typeof schema>;
		}
		return this.db!;
	}
}
