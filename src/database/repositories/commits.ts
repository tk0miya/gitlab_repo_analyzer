import { and, count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/database/connection";
import {
	type Commit,
	commits,
	type NewCommit,
} from "@/database/schema/commits";

/**
 * コミット操作のリポジトリクラス
 * commitsテーブルに対するCRUD操作を提供
 */
export class CommitsRepository {
	// ==================== CREATE操作 ====================

	/**
	 * コミットを作成
	 * @param commitData 新規コミットデータ
	 * @returns 作成されたコミット
	 */
	async create(commitData: NewCommit): Promise<Commit> {
		const db = await getDb();
		const [created] = await db.insert(commits).values(commitData).returning();
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

		const db = await getDb();
		const created = await db.insert(commits).values(commitsData).returning();
		return created;
	}

	// ==================== READ操作 ====================

	/**
	 * 内部IDでコミットを取得
	 * @param id 内部ID
	 * @returns コミット情報（見つからない場合はnull）
	 */
	async findById(id: number): Promise<Commit | null> {
		const db = await getDb();
		const [commit] = await db.select().from(commits).where(eq(commits.id, id));
		return commit || null;
	}

	/**
	 * プロジェクトID + SHAでコミットを取得
	 * @param projectId プロジェクトID
	 * @param sha コミットSHA
	 * @returns コミット情報（見つからない場合はnull）
	 */
	async findBySha(projectId: number, sha: string): Promise<Commit | null> {
		const db = await getDb();
		const [commit] = await db
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
		const db = await getDb();
		return await db
			.select()
			.from(commits)
			.where(eq(commits.project_id, projectId))
			.orderBy(desc(commits.authored_date))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * SHA配列でコミットを取得
	 * @param shas SHA配列
	 * @returns コミット配列
	 */
	async findAllBySha(shas: string[]): Promise<Commit[]> {
		if (shas.length === 0) {
			return [];
		}

		const db = await getDb();
		return await db
			.select()
			.from(commits)
			.where(inArray(commits.sha, shas))
			.orderBy(desc(commits.authored_date));
	}

	/**
	 * プロジェクトのコミット総数を取得
	 * @param projectId プロジェクトID
	 * @returns コミット総数
	 */
	async countByProject(projectId: number): Promise<number> {
		const db = await getDb();
		const [result] = await db
			.select({ count: count() })
			.from(commits)
			.where(eq(commits.project_id, projectId));
		return Number(result?.count || 0);
	}

	// ==================== DELETE操作 ====================

	/**
	 * コミットを削除
	 * @param id 内部ID
	 * @returns 削除成功の場合true
	 */
	async delete(id: number): Promise<boolean> {
		const db = await getDb();
		const [deleted] = await db
			.delete(commits)
			.where(eq(commits.id, id))
			.returning();
		return !!deleted;
	}
}
