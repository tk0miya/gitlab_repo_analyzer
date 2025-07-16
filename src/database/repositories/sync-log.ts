import { and, desc, eq, sql } from "drizzle-orm";
import { type NewSyncLog, type SyncLog, syncLogs } from "../schema.js";
import { BaseRepository } from "./base.js";

/**
 * 同期ログリポジトリ
 */
export class SyncLogRepository extends BaseRepository {
	/**
	 * 同期ログの作成
	 */
	async create(syncLog: NewSyncLog): Promise<SyncLog> {
		const [result] = await this.db.insert(syncLogs).values(syncLog).returning();
		return result;
	}

	/**
	 * 同期ログの更新
	 */
	async update(
		id: number,
		syncLog: Partial<NewSyncLog>,
	): Promise<SyncLog | null> {
		const [result] = await this.db
			.update(syncLogs)
			.set(syncLog)
			.where(eq(syncLogs.id, id))
			.returning();
		return result || null;
	}

	/**
	 * 同期ログの削除
	 */
	async delete(id: number): Promise<boolean> {
		const result = await this.db.delete(syncLogs).where(eq(syncLogs.id, id));
		return (result.rowCount ?? 0) > 0;
	}

	/**
	 * IDによる同期ログの取得
	 */
	async findById(id: number): Promise<SyncLog | null> {
		const result = await this.db
			.select()
			.from(syncLogs)
			.where(eq(syncLogs.id, id))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * プロジェクトIDによる同期ログ一覧の取得
	 */
	async findByProjectId(
		projectId: number,
		options?: {
			syncType?: string;
			status?: string;
			limit?: number;
			offset?: number;
		},
	): Promise<SyncLog[]> {
		const conditions = [eq(syncLogs.projectId, projectId)];

		// 同期タイプフィルター
		if (options?.syncType) {
			conditions.push(eq(syncLogs.syncType, options.syncType));
		}

		// ステータスフィルター
		if (options?.status) {
			conditions.push(eq(syncLogs.status, options.status));
		}

		const query = this.db
			.select()
			.from(syncLogs)
			.where(and(...conditions))
			.orderBy(desc(syncLogs.startedAt));

		// リミット・オフセット
		if (options?.limit && options?.offset) {
			return await query.limit(options.limit).offset(options.offset);
		} else if (options?.limit) {
			return await query.limit(options.limit);
		} else if (options?.offset) {
			return await query.offset(options.offset);
		}

		return await query;
	}

	/**
	 * 最新の完了した同期ログの取得
	 */
	async findLatestCompleted(
		projectId: number,
		syncType?: string,
	): Promise<SyncLog | null> {
		let whereConditions = and(
			eq(syncLogs.projectId, projectId),
			eq(syncLogs.status, "completed"),
		);

		// 同期タイプフィルター
		if (syncType) {
			whereConditions = and(whereConditions, eq(syncLogs.syncType, syncType));
		}

		const result = await this.db
			.select()
			.from(syncLogs)
			.where(whereConditions)
			.orderBy(desc(syncLogs.completedAt))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * 実行中の同期ログの取得
	 */
	async findRunning(projectId: number): Promise<SyncLog[]> {
		return await this.db
			.select()
			.from(syncLogs)
			.where(
				and(eq(syncLogs.projectId, projectId), eq(syncLogs.status, "running")),
			)
			.orderBy(desc(syncLogs.startedAt));
	}

	/**
	 * 失敗した同期ログの取得
	 */
	async findFailed(
		projectId: number,
		options?: {
			limit?: number;
			offset?: number;
		},
	): Promise<SyncLog[]> {
		const query = this.db
			.select()
			.from(syncLogs)
			.where(
				and(eq(syncLogs.projectId, projectId), eq(syncLogs.status, "failed")),
			)
			.orderBy(desc(syncLogs.startedAt));

		// リミット・オフセット
		if (options?.limit && options?.offset) {
			return await query.limit(options.limit).offset(options.offset);
		} else if (options?.limit) {
			return await query.limit(options.limit);
		} else if (options?.offset) {
			return await query.offset(options.offset);
		}

		return await query;
	}

	/**
	 * 同期ログの完了
	 */
	async complete(
		id: number,
		result: {
			recordsProcessed: number;
			recordsAdded: number;
			recordsUpdated: number;
			lastCommitSha?: string;
			lastCommitDate?: Date;
		},
	): Promise<SyncLog | null> {
		const now = new Date();
		const current = await this.findById(id);

		if (!current) {
			return null;
		}

		const durationSeconds = current.startedAt
			? Math.floor((now.getTime() - current.startedAt.getTime()) / 1000)
			: null;

		const [updated] = await this.db
			.update(syncLogs)
			.set({
				status: "completed",
				completedAt: now,
				durationSeconds,
				recordsProcessed: result.recordsProcessed,
				recordsAdded: result.recordsAdded,
				recordsUpdated: result.recordsUpdated,
				lastCommitSha: result.lastCommitSha,
				lastCommitDate: result.lastCommitDate,
			})
			.where(eq(syncLogs.id, id))
			.returning();

		return updated;
	}

	/**
	 * 同期ログの失敗
	 */
	async fail(id: number, errorMessage: string): Promise<SyncLog | null> {
		const now = new Date();
		const current = await this.findById(id);

		if (!current) {
			return null;
		}

		const durationSeconds = current.startedAt
			? Math.floor((now.getTime() - current.startedAt.getTime()) / 1000)
			: null;

		const [updated] = await this.db
			.update(syncLogs)
			.set({
				status: "failed",
				completedAt: now,
				durationSeconds,
				errorMessage,
			})
			.where(eq(syncLogs.id, id))
			.returning();

		return updated;
	}

	/**
	 * 同期統計の取得
	 */
	async getStats(projectId: number): Promise<{
		total: number;
		completed: number;
		failed: number;
		running: number;
		pending: number;
	}> {
		const result = await this.db
			.select({
				status: syncLogs.status,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(syncLogs)
			.where(eq(syncLogs.projectId, projectId))
			.groupBy(syncLogs.status);

		const stats = {
			total: 0,
			completed: 0,
			failed: 0,
			running: 0,
			pending: 0,
		};

		for (const row of result) {
			stats.total += row.count;
			switch (row.status) {
				case "completed":
					stats.completed = row.count;
					break;
				case "failed":
					stats.failed = row.count;
					break;
				case "running":
					stats.running = row.count;
					break;
				case "pending":
					stats.pending = row.count;
					break;
			}
		}

		return stats;
	}

	/**
	 * 古い同期ログの削除
	 */
	async deleteOldLogs(
		projectId: number,
		keepDays: number = 30,
	): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - keepDays);

		const result = await this.db
			.delete(syncLogs)
			.where(
				and(
					eq(syncLogs.projectId, projectId),
					sql`${syncLogs.startedAt} < ${cutoffDate}`,
				),
			);

		return result.rowCount ?? 0;
	}

	/**
	 * 同期ログ数の取得
	 */
	async count(projectId?: number, status?: string): Promise<number> {
		const baseQuery = this.db
			.select({ count: sql<number>`COUNT(*)::int` })
			.from(syncLogs);

		if (projectId && status) {
			const result = await baseQuery.where(
				and(eq(syncLogs.projectId, projectId), eq(syncLogs.status, status)),
			);
			return result[0].count;
		} else if (projectId) {
			const result = await baseQuery.where(eq(syncLogs.projectId, projectId));
			return result[0].count;
		}

		const result = await baseQuery;
		return result[0].count;
	}
}
