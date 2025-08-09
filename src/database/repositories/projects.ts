import { asc, count, eq, max } from "drizzle-orm";
import { getDb } from "@/database/connection";
import { commits } from "@/database/schema/commits";
import {
	type NewProject,
	type Project,
	type ProjectWithStats,
	projects,
} from "@/database/schema/projects";
import { syncLogs } from "@/database/schema/sync-logs";

/**
 * プロジェクト操作のリポジトリクラス
 * プロジェクトテーブルに対するCRUD操作を提供
 */
export class ProjectsRepository {
	/**
	 * プロジェクトを作成
	 * @param projectData 新規プロジェクトデータ
	 * @returns 作成されたプロジェクト
	 */
	async create(projectData: NewProject): Promise<Project> {
		const db = await getDb();
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
		const db = await getDb();
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
		const db = await getDb();
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
		const db = await getDb();
		return await db
			.select()
			.from(projects)
			.orderBy(asc(projects.name))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * 統計情報付きプロジェクト一覧を取得（ページネーション対応）
	 * コミット数と最終コミット同期日を含む
	 * @param limit 取得件数制限（デフォルト: 100）
	 * @param offset オフセット（デフォルト: 0）
	 * @returns 統計情報付きプロジェクト配列（name昇順でソート）
	 */
	async findAllWithStats(
		limit: number = 100,
		offset: number = 0,
	): Promise<ProjectWithStats[]> {
		const db = await getDb();

		// 最新のコミット同期ログサブクエリ
		const latestCommitSyncLogs = db
			.select({
				project_id: syncLogs.project_id,
				last_item_date: max(syncLogs.last_item_date).as("last_item_date"),
			})
			.from(syncLogs)
			.where(eq(syncLogs.sync_type, "commits"))
			.groupBy(syncLogs.project_id)
			.as("latest_sync");

		return await db
			.select({
				// プロジェクト基本情報
				id: projects.id,
				gitlab_id: projects.gitlab_id,
				name: projects.name,
				description: projects.description,
				web_url: projects.web_url,
				default_branch: projects.default_branch,
				visibility: projects.visibility,
				created_at: projects.created_at,
				gitlab_created_at: projects.gitlab_created_at,

				// 統計情報
				commitCount: count(commits.id),
				lastCommitDate: latestCommitSyncLogs.last_item_date,
			})
			.from(projects)
			.leftJoin(commits, eq(projects.id, commits.project_id))
			.leftJoin(
				latestCommitSyncLogs,
				eq(projects.id, latestCommitSyncLogs.project_id),
			)
			.groupBy(projects.id, latestCommitSyncLogs.last_item_date)
			.orderBy(asc(projects.name))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * プロジェクト総数を取得
	 * @returns プロジェクト総数
	 */
	async count(): Promise<number> {
		const db = await getDb();
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
		const db = await getDb();
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
		const db = await getDb();
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
