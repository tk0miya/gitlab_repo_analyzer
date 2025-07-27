// データベース統合ファイル
// 全てのデータベース機能をこのファイルから提供

import { and, asc, count, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// 接続とコア機能
export { closeConnection, db, pool, testConnection } from "./connection.js";

// スキーマ定義
export * from "./schema/index.js";

// 接続インポート
import { db } from "./connection.js";
// スキーマインポート
import { type Commit, commits, type NewCommit } from "./schema/commits.js";
import type * as schema from "./schema/index.js";
import { type NewProject, type Project, projects } from "./schema/projects.js";
import {
	type NewSyncLog,
	SYNC_STATUSES,
	type SyncLog,
	type SyncStatus,
	type SyncType,
	syncLogs,
} from "./schema/sync-logs.js";

// ==================== SyncLogs関連インターフェース ====================

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

// ==================== CommitsRepository ====================

/**
 * コミット操作のリポジトリクラス
 * commitsテーブルに対するCRUD操作を提供
 */
export class CommitsRepository {
	private db: NodePgDatabase<typeof schema>;

	constructor(database?: NodePgDatabase<typeof schema>) {
		this.db = database || db;
	}

	// ==================== CREATE操作 ====================

	/**
	 * コミットを作成
	 * @param commitData 新規コミットデータ
	 * @returns 作成されたコミット
	 */
	async create(commitData: NewCommit): Promise<Commit> {
		const [created] = await this.db
			.insert(commits)
			.values(commitData)
			.returning();
		if (!created) {
			throw new Error("コミットの作成に失敗しました");
		}
		return created;
	}

	/**
	 * 複数のコミットを一括作成
	 * @param commitsData 新規コミットデータ配列
	 * @returns 作成されたコミット配列
	 */
	async bulkInsert(commitsData: NewCommit[]): Promise<Commit[]> {
		if (commitsData.length === 0) {
			return [];
		}

		const created = await this.db
			.insert(commits)
			.values(commitsData)
			.returning();
		return created;
	}

	/**
	 * プロジェクトID + SHAでコミットを作成または更新（upsert）
	 * @param projectId プロジェクトID
	 * @param commitData コミットデータ
	 * @returns 作成または更新されたコミット
	 */
	async upsertBySha(projectId: number, commitData: NewCommit): Promise<Commit> {
		if (!commitData.sha) {
			throw new Error("コミットSHAが必要です");
		}

		const existing = await this.findBySha(projectId, commitData.sha);
		if (existing) {
			const updated = await this.update(existing.id, commitData);
			if (!updated) {
				throw new Error("コミットの更新に失敗しました");
			}
			return updated;
		} else {
			return await this.create(commitData);
		}
	}

	// ==================== READ操作 ====================

	/**
	 * 内部IDでコミットを取得
	 * @param id 内部ID
	 * @returns コミット情報（見つからない場合はnull）
	 */
	async findById(id: number): Promise<Commit | null> {
		const [commit] = await this.db
			.select()
			.from(commits)
			.where(eq(commits.id, id));
		return commit || null;
	}

	/**
	 * プロジェクトID + SHAでコミットを取得
	 * @param projectId プロジェクトID
	 * @param sha コミットSHA
	 * @returns コミット情報（見つからない場合はnull）
	 */
	async findBySha(projectId: number, sha: string): Promise<Commit | null> {
		const [commit] = await this.db
			.select()
			.from(commits)
			.where(and(eq(commits.project_id, projectId), eq(commits.sha, sha)));
		return commit || null;
	}

	/**
	 * プロジェクトのコミット一覧を取得
	 * @param projectId プロジェクトID
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns コミット配列（作者日時降順でソート）
	 */
	async findByProject(
		projectId: number,
		limit: number = 100,
		offset: number = 0,
	): Promise<Commit[]> {
		return await this.db
			.select()
			.from(commits)
			.where(eq(commits.project_id, projectId))
			.orderBy(desc(commits.author_date))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * 作者メールアドレスでコミットを取得
	 * @param projectId プロジェクトID
	 * @param authorEmail 作者メールアドレス
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns コミット配列（作者日時降順でソート）
	 */
	async findCommitsByAuthor(
		projectId: number,
		authorEmail: string,
		limit: number = 100,
		offset: number = 0,
	): Promise<Commit[]> {
		return await this.db
			.select()
			.from(commits)
			.where(
				and(
					eq(commits.project_id, projectId),
					eq(commits.author_email, authorEmail),
				),
			)
			.orderBy(desc(commits.author_date))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * プロジェクトのコミット総数を取得
	 * @param projectId プロジェクトID
	 * @returns コミット総数
	 */
	async countByProject(projectId: number): Promise<number> {
		const [result] = await this.db
			.select({ count: count() })
			.from(commits)
			.where(eq(commits.project_id, projectId));
		return Number(result?.count || 0);
	}

	// ==================== UPDATE操作 ====================

	/**
	 * コミットを更新
	 * @param id 内部ID
	 * @param updateData 更新データ
	 * @returns 更新されたコミット（見つからない場合はnull）
	 */
	async update(
		id: number,
		updateData: Partial<NewCommit>,
	): Promise<Commit | null> {
		const [updated] = await this.db
			.update(commits)
			.set(updateData)
			.where(eq(commits.id, id))
			.returning();
		return updated || null;
	}

	// ==================== DELETE操作 ====================

	/**
	 * コミットを削除
	 * @param id 内部ID
	 * @returns 削除成功の場合true
	 */
	async delete(id: number): Promise<boolean> {
		const [deleted] = await this.db
			.delete(commits)
			.where(eq(commits.id, id))
			.returning();
		return !!deleted;
	}
}

// ==================== ProjectsRepository ====================

/**
 * プロジェクト操作のリポジトリクラス
 * プロジェクトテーブルに対するCRUD操作を提供
 */
export class ProjectsRepository {
	private db: NodePgDatabase<typeof schema>;

	constructor(database?: NodePgDatabase<typeof schema>) {
		this.db = database || db;
	}
	/**
	 * プロジェクトを作成
	 * @param projectData 新規プロジェクトデータ
	 * @returns 作成されたプロジェクト
	 */
	async create(projectData: NewProject): Promise<Project> {
		const [created] = await this.db
			.insert(projects)
			.values(projectData)
			.returning();
		if (!created) {
			throw new Error("プロジェクトの作成に失敗しました");
		}
		return created;
	}

	/**
	 * 内部IDでプロジェクトを取得
	 * @param id 内部ID
	 * @returns プロジェクト情報（見つからない場合はnull）
	 */
	async findById(id: number): Promise<Project | null> {
		const [project] = await this.db
			.select()
			.from(projects)
			.where(eq(projects.id, id));
		return project || null;
	}

	/**
	 * GitLab IDでプロジェクトを取得
	 * @param gitlabId GitLab プロジェクトID
	 * @returns プロジェクト情報（見つからない場合はnull）
	 */
	async findByGitlabId(gitlabId: number): Promise<Project | null> {
		const [project] = await this.db
			.select()
			.from(projects)
			.where(eq(projects.gitlab_id, gitlabId));
		return project || null;
	}

	/**
	 * GitLab URLでプロジェクトを取得
	 * @param webUrl GitLab プロジェクトのWebURL
	 * @returns プロジェクト情報（見つからない場合はnull）
	 */
	async findByUrl(webUrl: string): Promise<Project | null> {
		const [project] = await this.db
			.select()
			.from(projects)
			.where(eq(projects.web_url, webUrl));
		return project || null;
	}

	/**
	 * すべてのプロジェクトを取得（ページネーション対応）
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns プロジェクト配列（name昇順でソート）
	 */
	async findAll(limit: number = 100, offset: number = 0): Promise<Project[]> {
		return await this.db
			.select()
			.from(projects)
			.orderBy(asc(projects.name))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * プロジェクト総数を取得
	 * @returns プロジェクト総数
	 */
	async count(): Promise<number> {
		const [result] = await this.db.select({ count: count() }).from(projects);
		return Number(result?.count || 0);
	}

	/**
	 * プロジェクトを更新
	 * @param id 内部ID
	 * @param updateData 更新データ
	 * @returns 更新されたプロジェクト（見つからない場合はnull）
	 */
	async update(
		id: number,
		updateData: Partial<NewProject>,
	): Promise<Project | null> {
		const [updated] = await this.db
			.update(projects)
			.set(updateData)
			.where(eq(projects.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * プロジェクトを削除
	 * @param id 内部ID
	 * @returns 削除成功の場合true
	 */
	async delete(id: number): Promise<boolean> {
		const [deleted] = await this.db
			.delete(projects)
			.where(eq(projects.id, id))
			.returning();
		return !!deleted;
	}

	/**
	 * プロジェクトを作成または更新（upsert）
	 * @param projectData プロジェクトデータ
	 * @returns 作成または更新されたプロジェクト
	 */
	async upsert(projectData: NewProject): Promise<Project> {
		if (!projectData.gitlab_id) {
			throw new Error("GitLab IDが必要です");
		}

		const existing = await this.findByGitlabId(projectData.gitlab_id);
		if (existing) {
			const updated = await this.update(existing.id, projectData);
			if (!updated) {
				throw new Error("プロジェクトの更新に失敗しました");
			}
			return updated;
		} else {
			return await this.create(projectData);
		}
	}
}

// ==================== SyncLogsRepository ====================

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

// ==================== シングルトンインスタンス ====================

// シングルトンインスタンスをエクスポート
export const commitsRepository = new CommitsRepository();
export const projectsRepository = new ProjectsRepository();
export const syncLogsRepository = new SyncLogsRepository();
