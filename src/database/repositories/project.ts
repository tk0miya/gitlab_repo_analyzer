import { asc, desc, eq } from "drizzle-orm";
import { type NewProject, type Project, projects } from "../schema.js";
import { BaseRepository } from "./base.js";

/**
 * プロジェクトリポジトリ
 */
export class ProjectRepository extends BaseRepository {
	/**
	 * プロジェクトの作成
	 */
	async create(project: NewProject): Promise<Project> {
		const [result] = await this.db.insert(projects).values(project).returning();
		return result;
	}

	/**
	 * プロジェクトの更新
	 */
	async update(
		id: number,
		project: Partial<NewProject>,
	): Promise<Project | null> {
		const [result] = await this.db
			.update(projects)
			.set({ ...project, updatedAt: new Date() })
			.where(eq(projects.id, id))
			.returning();
		return result || null;
	}

	/**
	 * プロジェクトの削除
	 */
	async delete(id: number): Promise<boolean> {
		const result = await this.db.delete(projects).where(eq(projects.id, id));
		return (result.rowCount ?? 0) > 0;
	}

	/**
	 * IDによるプロジェクトの取得
	 */
	async findById(id: number): Promise<Project | null> {
		const result = await this.db
			.select()
			.from(projects)
			.where(eq(projects.id, id))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * GitLab IDによるプロジェクトの取得
	 */
	async findByGitlabId(gitlabId: number): Promise<Project | null> {
		const result = await this.db
			.select()
			.from(projects)
			.where(eq(projects.gitlabId, gitlabId))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * プロジェクト名による検索
	 */
	async findByName(name: string): Promise<Project | null> {
		const result = await this.db
			.select()
			.from(projects)
			.where(eq(projects.name, name))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 全プロジェクトの取得
	 */
	async findAll(options?: {
		orderBy?: "name" | "created_at" | "updated_at";
		order?: "asc" | "desc";
		onlyActive?: boolean;
	}): Promise<Project[]> {
		let baseQuery = this.db.select().from(projects);

		// アクティブなプロジェクトのみ取得
		if (options?.onlyActive) {
			baseQuery = baseQuery.where(eq(projects.isActive, true));
		}

		// ソート
		if (options?.orderBy) {
			const orderFn = options.order === "desc" ? desc : asc;
			switch (options.orderBy) {
				case "name":
					baseQuery = baseQuery.orderBy(orderFn(projects.name));
					break;
				case "created_at":
					baseQuery = baseQuery.orderBy(orderFn(projects.createdAt));
					break;
				case "updated_at":
					baseQuery = baseQuery.orderBy(orderFn(projects.updatedAt));
					break;
			}
		}

		return await baseQuery;
	}

	/**
	 * プロジェクトの存在確認
	 */
	async exists(gitlabId: number): Promise<boolean> {
		const result = await this.db
			.select({ id: projects.id })
			.from(projects)
			.where(eq(projects.gitlabId, gitlabId))
			.limit(1);
		return result.length > 0;
	}

	/**
	 * プロジェクトの非アクティブ化
	 */
	async deactivate(id: number): Promise<boolean> {
		const result = await this.db
			.update(projects)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(projects.id, id));
		return (result.rowCount ?? 0) > 0;
	}

	/**
	 * プロジェクトの再アクティブ化
	 */
	async reactivate(id: number): Promise<boolean> {
		const result = await this.db
			.update(projects)
			.set({ isActive: true, updatedAt: new Date() })
			.where(eq(projects.id, id));
		return (result.rowCount ?? 0) > 0;
	}
}
