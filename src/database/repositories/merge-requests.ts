import { eq } from "drizzle-orm";
import { getDb } from "@/database/connection";
import type {
	MergeRequest,
	NewMergeRequest,
} from "@/database/schema/merge-requests";
import { mergeRequests } from "@/database/schema/merge-requests";

/**
 * マージリクエスト操作のリポジトリクラス
 * マージリクエストテーブルに対するCRUD操作を提供
 */
export class MergeRequestsRepository {
	/**
	 * プロジェクト別マージリクエスト取得
	 * @param projectId プロジェクト内部ID
	 * @returns マージリクエスト配列
	 */
	async findByProject(projectId: number): Promise<MergeRequest[]> {
		const db = await getDb();
		return await db
			.select()
			.from(mergeRequests)
			.where(eq(mergeRequests.project_id, projectId))
			.orderBy(mergeRequests.gitlab_created_at);
	}

	/**
	 * 単一マージリクエスト保存・更新（upsert）
	 * gitlab_id をキーとして重複チェックし、存在する場合は更新、しない場合は作成
	 * @param mergeRequest マージリクエストデータ
	 * @returns 作成または更新されたマージリクエスト
	 */
	async upsert(mergeRequest: NewMergeRequest): Promise<MergeRequest> {
		if (!mergeRequest.gitlab_id) {
			throw new Error("GitLab IDが必要です");
		}

		const existing = await this.findByGitlabId(mergeRequest.gitlab_id);
		if (existing) {
			const updated = await this.update(existing.id, mergeRequest);
			if (!updated) {
				throw new Error("マージリクエストの更新に失敗しました");
			}
			return updated;
		} else {
			return await this.create(mergeRequest);
		}
	}

	/**
	 * 一括マージリクエスト保存・更新（bulkUpsert）
	 * 複数のマージリクエストを効率的に保存・更新
	 * @param mergeRequestList マージリクエストデータ配列
	 * @returns 作成または更新されたマージリクエスト配列
	 */
	async bulkUpsert(
		mergeRequestList: NewMergeRequest[],
	): Promise<MergeRequest[]> {
		const results: MergeRequest[] = [];

		// トランザクション内で一括処理
		const db = await getDb();
		return await db.transaction(async () => {
			for (const mergeRequest of mergeRequestList) {
				const result = await this.upsert(mergeRequest);
				results.push(result);
			}
			return results;
		});
	}

	/**
	 * マージリクエストを作成
	 * @param mergeRequestData 新規マージリクエストデータ
	 * @returns 作成されたマージリクエスト
	 */
	private async create(
		mergeRequestData: NewMergeRequest,
	): Promise<MergeRequest> {
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
	 * GitLab IDでマージリクエストを取得
	 * @param gitlabId GitLab マージリクエストID
	 * @returns マージリクエスト情報（見つからない場合はnull）
	 */
	private async findByGitlabId(gitlabId: number): Promise<MergeRequest | null> {
		const db = await getDb();
		const [mergeRequest] = await db
			.select()
			.from(mergeRequests)
			.where(eq(mergeRequests.gitlab_id, gitlabId));
		return mergeRequest || null;
	}

	/**
	 * マージリクエストを更新
	 * @param id 内部ID
	 * @param updateData 更新データ
	 * @returns 更新されたマージリクエスト（見つからない場合はnull）
	 */
	private async update(
		id: number,
		updateData: Partial<NewMergeRequest>,
	): Promise<MergeRequest | null> {
		const db = await getDb();
		const [updated] = await db
			.update(mergeRequests)
			.set(updateData)
			.where(eq(mergeRequests.id, id))
			.returning();
		return updated || null;
	}
}
