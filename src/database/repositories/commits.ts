import { and, count, desc, eq } from "drizzle-orm";
import {
	type Commit,
	commits,
	type NewCommit,
} from "@/database/schema/commits";
import { BaseRepository } from "./base";

/**
 * コミット操作のリポジトリクラス
 * commitsテーブルに対するCRUD操作を提供
 */
export class CommitsRepository extends BaseRepository {
	// ==================== CREATE操作 ====================

	/**
	 * コミットを作成
	 * @param commitData 新規コミットデータ
	 * @returns 作成されたコミット
	 */
	async create(commitData: NewCommit): Promise<Commit> {
		const db = await this.getDatabase();
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

		const db = await this.getDatabase();
		const created = await db.insert(commits).values(commitsData).returning();
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
		const db = await this.getDatabase();
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
		const db = await this.getDatabase();
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
		const db = await this.getDatabase();
		return await db
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
		const db = await this.getDatabase();
		return await db
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
		const db = await this.getDatabase();
		const [result] = await db
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
		const db = await this.getDatabase();
		const [updated] = await db
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
		const db = await this.getDatabase();
		const [deleted] = await db
			.delete(commits)
			.where(eq(commits.id, id))
			.returning();
		return !!deleted;
	}
}
