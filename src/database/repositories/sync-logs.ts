import { and, count, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "../connection.js";
import type * as schema from "../schema/index.js";
import {
	type NewSyncLog,
	SYNC_STATUSES,
	type SyncLog,
	type SyncStatus,
	type SyncType,
	syncLogs,
} from "../schema/sync-logs.js";

/**
 * 同期完了時のパラメータ
 */
export interface CompleteSyncParams {
	records_processed?: number;
	records_added?: number;
}

/**
 * 同期失敗時のパラメータ
 */
export interface FailSyncParams {
	error_message: string;
}

/**
 * 検索条件パラメータ
 */
export interface FindSyncLogsParams {
	project_id?: number;
	sync_type?: SyncType;
	status?: SyncStatus;
	limit?: number;
	offset?: number;
}

/**
 * 同期ログ操作のリポジトリクラス
 * 同期履歴テーブルに対するCRUD操作と同期状態管理を提供
 */
export class SyncLogsRepository {
	private db: NodePgDatabase<typeof schema>;

	constructor(database?: NodePgDatabase<typeof schema>) {
		this.db = database || db;
	}

	// ==================== CREATE操作 ====================

	/**
	 * 同期ログを作成
	 * @param syncLogData 新規同期ログデータ
	 * @returns 作成された同期ログ
	 */
	async create(syncLogData: NewSyncLog): Promise<SyncLog> {
		// ステータス未指定時はrunningをデフォルトに設定
		const dataWithDefaults = {
			...syncLogData,
			status: syncLogData.status ?? SYNC_STATUSES.RUNNING,
		};

		const [created] = await this.db
			.insert(syncLogs)
			.values(dataWithDefaults)
			.returning();

		if (!created) {
			throw new Error("同期ログの作成に失敗しました");
		}
		return created;
	}

	// ==================== READ操作 ====================

	/**
	 * IDで同期ログを取得
	 * @param id 同期ログID
	 * @returns 同期ログ情報（見つからない場合はnull）
	 */
	async findById(id: number): Promise<SyncLog | null> {
		const [log] = await this.db
			.select()
			.from(syncLogs)
			.where(eq(syncLogs.id, id));
		return log || null;
	}

	/**
	 * 条件に基づいて同期ログを検索（ページネーション対応）
	 * @param params 検索条件
	 * @returns 同期ログ配列（開始日時降順でソート）
	 */
	async find(params: FindSyncLogsParams = {}): Promise<SyncLog[]> {
		const { project_id, sync_type, status, limit = 100, offset = 0 } = params;

		// 条件を構築
		const conditions = [];
		if (project_id !== undefined) {
			conditions.push(eq(syncLogs.project_id, project_id));
		}
		if (sync_type !== undefined) {
			conditions.push(eq(syncLogs.sync_type, sync_type));
		}
		if (status !== undefined) {
			conditions.push(eq(syncLogs.status, status));
		}

		// 条件に応じてクエリを構築
		if (conditions.length > 0) {
			return await this.db
				.select()
				.from(syncLogs)
				.where(and(...conditions))
				.orderBy(desc(syncLogs.started_at))
				.limit(limit)
				.offset(offset);
		} else {
			return await this.db
				.select()
				.from(syncLogs)
				.orderBy(desc(syncLogs.started_at))
				.limit(limit)
				.offset(offset);
		}
	}

	/**
	 * プロジェクトの同期ログを取得
	 * @param project_id プロジェクトID
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns 同期ログ配列
	 */
	async findByProject(
		project_id: number,
		limit: number = 100,
		offset: number = 0,
	): Promise<SyncLog[]> {
		return await this.find({ project_id, limit, offset });
	}

	/**
	 * 最新の同期ログを取得
	 * @param project_id プロジェクトID
	 * @param sync_type 同期タイプ（任意）
	 * @returns 最新の同期ログ（見つからない場合はnull）
	 */
	async findLatest(
		project_id: number,
		sync_type?: SyncType,
	): Promise<SyncLog | null> {
		const logs = await this.find({
			project_id,
			sync_type,
			limit: 1,
			offset: 0,
		});
		return logs[0] || null;
	}

	/**
	 * 同期ログ総数を取得
	 * @param params 検索条件
	 * @returns 同期ログ総数
	 */
	async count(
		params: Omit<FindSyncLogsParams, "limit" | "offset"> = {},
	): Promise<number> {
		const { project_id, sync_type, status } = params;

		// 条件を構築
		const conditions = [];
		if (project_id !== undefined) {
			conditions.push(eq(syncLogs.project_id, project_id));
		}
		if (sync_type !== undefined) {
			conditions.push(eq(syncLogs.sync_type, sync_type));
		}
		if (status !== undefined) {
			conditions.push(eq(syncLogs.status, status));
		}

		// 条件に応じてクエリを構築
		let result: { count: number } | undefined;
		if (conditions.length > 0) {
			[result] = await this.db
				.select({ count: count() })
				.from(syncLogs)
				.where(and(...conditions));
		} else {
			[result] = await this.db.select({ count: count() }).from(syncLogs);
		}

		return Number(result?.count || 0);
	}

	// ==================== UPDATE操作 ====================

	/**
	 * 同期ログを更新
	 * @param id 同期ログID
	 * @param updateData 更新データ
	 * @returns 更新された同期ログ（見つからない場合はnull）
	 */
	async update(
		id: number,
		updateData: Partial<NewSyncLog>,
	): Promise<SyncLog | null> {
		const [updated] = await this.db
			.update(syncLogs)
			.set(updateData)
			.where(eq(syncLogs.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * 同期処理を完了
	 * @param id 同期ログID
	 * @param params 同期完了パラメータ
	 * @returns 更新された同期ログ（見つからない場合はnull）
	 */
	async completeSync(
		id: number,
		params: CompleteSyncParams = {},
	): Promise<SyncLog | null> {
		const { records_processed, records_added } = params;

		return await this.update(id, {
			status: SYNC_STATUSES.COMPLETED,
			completed_at: new Date(),
			records_processed,
			records_added,
		});
	}

	/**
	 * 同期処理を失敗
	 * @param id 同期ログID
	 * @param params 同期失敗パラメータ
	 * @returns 更新された同期ログ（見つからない場合はnull）
	 */
	async failSync(id: number, params: FailSyncParams): Promise<SyncLog | null> {
		const { error_message } = params;

		return await this.update(id, {
			status: SYNC_STATUSES.FAILED,
			completed_at: new Date(),
			error_message,
		});
	}
}

// シングルトンインスタンスをエクスポート
export const syncLogsRepository = new SyncLogsRepository();
