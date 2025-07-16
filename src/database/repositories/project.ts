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
	}): Promise<Project[]> {
		const baseQuery = this.db.select().from(projects);

		// ソート
		if (options?.orderBy) {
			const orderFn = options.order === "desc" ? desc : asc;
			switch (options.orderBy) {
				case "name":
					return await baseQuery.orderBy(orderFn(projects.name));
				case "created_at":
					return await baseQuery.orderBy(orderFn(projects.createdAt));
				case "updated_at":
					return await baseQuery.orderBy(orderFn(projects.updatedAt));
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
}
