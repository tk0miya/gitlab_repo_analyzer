import { asc, count, eq } from "drizzle-orm";
import {
	type NewProject,
	type Project,
	projects,
} from "@/database/schema/projects";
import { BaseRepository } from "./base";

/**
 * プロジェクト操作のリポジトリクラス
 * プロジェクトテーブルに対するCRUD操作を提供
 */
export class ProjectsRepository extends BaseRepository {
	/**
	 * プロジェクトを作成
	 * @param projectData 新規プロジェクトデータ
	 * @returns 作成されたプロジェクト
	 */
	async create(projectData: NewProject): Promise<Project> {
		const db = await this.getDatabase();
		const [created] = await db.insert(projects).values(projectData).returning();
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
		const db = await this.getDatabase();
		const [project] = await db
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
		const db = await this.getDatabase();
		const [project] = await db
			.select()
			.from(projects)
			.where(eq(projects.gitlab_id, gitlabId));
		return project || null;
	}

	/**
	 * すべてのプロジェクトを取得（ページネーション対応）
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns プロジェクト配列（name昇順でソート）
	 */
	async findAll(limit: number = 100, offset: number = 0): Promise<Project[]> {
		const db = await this.getDatabase();
		return await db
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
		const db = await this.getDatabase();
		const [result] = await db.select({ count: count() }).from(projects);
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
		const db = await this.getDatabase();
		const [updated] = await db
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
		const db = await this.getDatabase();
		const [deleted] = await db
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
