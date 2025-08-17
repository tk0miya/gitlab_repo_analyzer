import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/database/connection";
import {
	type MergeRequest,
	mergeRequests,
	type NewMergeRequest,
} from "@/database/schema/merge-requests";

/**
 * マージリクエスト操作のリポジトリクラス
 * merge_requestsテーブルに対するCRUD操作を提供
 */
export class MergeRequestsRepository {
	// ==================== CREATE操作 ====================

	/**
	 * マージリクエストを作成
	 * @param mergeRequestData 新規マージリクエストデータ
	 * @returns 作成されたマージリクエスト
	 */
	async create(mergeRequestData: NewMergeRequest): Promise<MergeRequest> {
		const db = await getDb();
		const [created] = await db
			.insert(mergeRequests)
			.values(mergeRequestData)
			.returning();
		if (!created) {
			throw new Error("マージリクエストの作成に失敗しました");
		}
		return created;
	}

	/**
	 * 複数のマージリクエストを一括作成
	 * @param mergeRequestsData 新規マージリクエストデータ配列
	 * @returns 作成されたマージリクエスト配列
	 */
	async bulkInsert(
		mergeRequestsData: NewMergeRequest[],
	): Promise<MergeRequest[]> {
		if (mergeRequestsData.length === 0) {
			return [];
		}

		const db = await getDb();
		const created = await db
			.insert(mergeRequests)
			.values(mergeRequestsData)
			.returning();
		return created;
	}

	// ==================== READ操作 ====================

	/**
	 * 内部IDでマージリクエストを取得
	 * @param id 内部ID
	 * @returns マージリクエスト情報（見つからない場合はnull）
	 */
	async findById(id: number): Promise<MergeRequest | null> {
		const db = await getDb();
		const [mergeRequest] = await db
			.select()
			.from(mergeRequests)
			.where(eq(mergeRequests.id, id));
		return mergeRequest || null;
	}

	/**
	 * プロジェクトID + GitLab IIDでマージリクエストを取得
	 * @param projectId プロジェクトID
	 * @param gitlabIid GitLab IID
	 * @returns マージリクエスト情報（見つからない場合はnull）
	 */
	async findByIid(
		projectId: number,
		gitlabIid: number,
	): Promise<MergeRequest | null> {
		const db = await getDb();
		const [mergeRequest] = await db
			.select()
			.from(mergeRequests)
			.where(
				and(
					eq(mergeRequests.project_id, projectId),
					eq(mergeRequests.gitlab_iid, gitlabIid),
				),
			);
		return mergeRequest || null;
	}

	/**
	 * GitLab IDでマージリクエストを取得
	 * @param gitlabId GitLab ID
	 * @returns マージリクエスト情報（見つからない場合はnull）
	 */
	async findByGitlabId(gitlabId: number): Promise<MergeRequest | null> {
		const db = await getDb();
		const [mergeRequest] = await db
			.select()
			.from(mergeRequests)
			.where(eq(mergeRequests.gitlab_id, gitlabId));
		return mergeRequest || null;
	}

	/**
	 * プロジェクトのマージリクエスト一覧を取得
	 * @param projectId プロジェクトID
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns マージリクエスト配列（GitLab更新日時降順でソート）
	 */
	async findByProject(
		projectId: number,
		limit: number = 100,
		offset: number = 0,
	): Promise<MergeRequest[]> {
		const db = await getDb();
		return await db
			.select()
			.from(mergeRequests)
			.where(eq(mergeRequests.project_id, projectId))
			.orderBy(desc(mergeRequests.gitlab_updated_at))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * プロジェクトのマージリクエスト総数を取得
	 * @param projectId プロジェクトID
	 * @returns マージリクエスト総数
	 */
	async countByProject(projectId: number): Promise<number> {
		const db = await getDb();
		const [result] = await db
			.select({ count: count() })
			.from(mergeRequests)
			.where(eq(mergeRequests.project_id, projectId));
		return Number(result?.count || 0);
	}

	// ==================== DELETE操作 ====================

	/**
	 * マージリクエストを削除
	 * @param id 内部ID
	 * @returns 削除成功の場合true
	 */
	async delete(id: number): Promise<boolean> {
		const db = await getDb();
		const [deleted] = await db
			.delete(mergeRequests)
			.where(eq(mergeRequests.id, id))
			.returning();
		return !!deleted;
	}
}
