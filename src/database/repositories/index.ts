// リポジトリのエクスポート
export { BaseRepository } from "./base.js";
export { CommitRepository } from "./commit.js";
export { ProjectRepository } from "./project.js";
export { SyncLogRepository } from "./sync-log.js";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../schema.js";
import { CommitRepository } from "./commit.js";
// 全リポジトリをまとめて管理するクラス
import { ProjectRepository } from "./project.js";
import { SyncLogRepository } from "./sync-log.js";

export class Repositories {
	public readonly projects: ProjectRepository;
	public readonly commits: CommitRepository;
	public readonly syncLogs: SyncLogRepository;

	constructor(db: NodePgDatabase<typeof schema>) {
		this.projects = new ProjectRepository(db);
		this.commits = new CommitRepository(db);
		this.syncLogs = new SyncLogRepository(db);
	}

	/**
	 * 非同期で初期化されたリポジトリインスタンスを作成
	 */
	static async create(): Promise<Repositories> {
		const { getDatabase } = await import("../connection.js");
		const db = await getDatabase();
		return new Repositories(db);
	}

	/**
	 * トランザクション用のリポジトリインスタンスを作成
	 */
	withTransaction(tx: NodePgDatabase<typeof schema>): Repositories {
		return new Repositories(tx);
	}
}
