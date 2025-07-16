import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { type Commit, commits, type NewCommit } from "../schema.js";
import { BaseRepository } from "./base.js";

/**
 * コミットリポジトリ
 */
export class CommitRepository extends BaseRepository {
	/**
	 * コミットの作成
	 */
	async create(commit: NewCommit): Promise<Commit> {
		const [result] = await this.db.insert(commits).values(commit).returning();
		return result;
	}

	/**
	 * 複数コミットの一括作成
	 */
	async createMany(commitList: NewCommit[]): Promise<Commit[]> {
		if (commitList.length === 0) return [];

		return await this.db.insert(commits).values(commitList).returning();
	}

	/**
	 * コミットの更新
	 */
	async update(id: number, commit: Partial<NewCommit>): Promise<Commit | null> {
		const [result] = await this.db
			.update(commits)
			.set(commit)
			.where(eq(commits.id, id))
			.returning();
		return result || null;
	}

	/**
	 * コミットの削除
	 */
	async delete(id: number): Promise<boolean> {
		const result = await this.db.delete(commits).where(eq(commits.id, id));
		return (result.rowCount ?? 0) > 0;
	}

	/**
	 * IDによるコミットの取得
	 */
	async findById(id: number): Promise<Commit | null> {
		const result = await this.db
			.select()
			.from(commits)
			.where(eq(commits.id, id))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * SHAによるコミットの取得
	 */
	async findBySha(sha: string): Promise<Commit | null> {
		const result = await this.db
			.select()
			.from(commits)
			.where(eq(commits.sha, sha))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * プロジェクトとSHAによるコミットの取得
	 */
	async findByProjectAndSha(
		projectId: number,
		sha: string,
	): Promise<Commit | null> {
		const result = await this.db
			.select()
			.from(commits)
			.where(and(eq(commits.projectId, projectId), eq(commits.sha, sha)))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * プロジェクトIDによるコミット一覧の取得
	 */
	async findByProjectId(
		projectId: number,
		options?: {
			orderBy?: "author_date" | "created_at";
			order?: "asc" | "desc";
			limit?: number;
			offset?: number;
		},
	): Promise<Commit[]> {
		const orderFn = options?.order === "asc" ? asc : desc;
		const orderColumn =
			options?.orderBy === "created_at"
				? commits.createdAt
				: commits.authorDate;

		const baseQuery = this.db
			.select()
			.from(commits)
			.where(eq(commits.projectId, projectId))
			.orderBy(orderFn(orderColumn));

		if (options?.limit && options?.offset) {
			return await baseQuery.limit(options.limit).offset(options.offset);
		} else if (options?.limit) {
			return await baseQuery.limit(options.limit);
		} else {
			return await baseQuery;
		}
	}

	/**
	 * 作者メールによるコミット一覧の取得
	 */
	async findByAuthorEmail(
		authorEmail: string,
		options?: {
			projectId?: number;
			orderBy?: "author_date" | "created_at";
			order?: "asc" | "desc";
			limit?: number;
		},
	): Promise<Commit[]> {
		const whereConditions = options?.projectId
			? and(
					eq(commits.authorEmail, authorEmail),
					eq(commits.projectId, options.projectId),
				)
			: eq(commits.authorEmail, authorEmail);

		const orderFn = options?.order === "asc" ? asc : desc;
		const orderColumn =
			options?.orderBy === "created_at"
				? commits.createdAt
				: commits.authorDate;

		const baseQuery = this.db
			.select()
			.from(commits)
			.where(whereConditions)
			.orderBy(orderFn(orderColumn));

		if (options?.limit) {
			return await baseQuery.limit(options.limit);
		} else {
			return await baseQuery;
		}
	}

	/**
	 * 期間によるコミット一覧の取得
	 */
	async findByDateRange(
		projectId: number,
		startDate: Date,
		endDate: Date,
		options?: {
			orderBy?: "author_date" | "created_at";
			order?: "asc" | "desc";
		},
	): Promise<Commit[]> {
		const baseQuery = this.db
			.select()
			.from(commits)
			.where(
				and(
					eq(commits.projectId, projectId),
					gte(commits.authorDate, startDate),
					lt(commits.authorDate, endDate),
				),
			);

		// ソート
		const orderFn = options?.order === "asc" ? asc : desc;
		if (options?.orderBy === "created_at") {
			return await baseQuery.orderBy(orderFn(commits.createdAt));
		} else {
			return await baseQuery.orderBy(orderFn(commits.authorDate));
		}
	}

	/**
	 * 作者別のコミット統計
	 */
	async getAuthorStats(projectId: number): Promise<
		{
			authorEmail: string;
			authorName: string;
			commitCount: number;
			totalAdditions: number;
			totalDeletions: number;
			totalChanges: number;
		}[]
	> {
		const result = await this.db
			.select({
				authorEmail: commits.authorEmail,
				authorName: commits.authorName,
				commitCount: sql<number>`COUNT(*)::int`,
				totalAdditions: sql<number>`SUM(${commits.additions})::int`,
				totalDeletions: sql<number>`SUM(${commits.deletions})::int`,
				totalChanges: sql<number>`SUM(${commits.totalChanges})::int`,
			})
			.from(commits)
			.where(eq(commits.projectId, projectId))
			.groupBy(commits.authorEmail, commits.authorName)
			.orderBy(sql`COUNT(*) DESC`);

		return result;
	}

	/**
	 * 月別のコミット統計
	 */
	async getMonthlyStats(projectId: number): Promise<
		{
			month: string;
			commitCount: number;
			totalAdditions: number;
			totalDeletions: number;
			totalChanges: number;
		}[]
	> {
		const result = await this.db
			.select({
				month: sql<string>`TO_CHAR(${commits.authorDate}, 'YYYY-MM')`,
				commitCount: sql<number>`COUNT(*)::int`,
				totalAdditions: sql<number>`SUM(${commits.additions})::int`,
				totalDeletions: sql<number>`SUM(${commits.deletions})::int`,
				totalChanges: sql<number>`SUM(${commits.totalChanges})::int`,
			})
			.from(commits)
			.where(eq(commits.projectId, projectId))
			.groupBy(sql`TO_CHAR(${commits.authorDate}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${commits.authorDate}, 'YYYY-MM')`);

		return result;
	}

	/**
	 * コミット数の取得
	 */
	async count(projectId?: number): Promise<number> {
		const baseQuery = this.db
			.select({ count: sql<number>`COUNT(*)::int` })
			.from(commits);

		if (projectId) {
			const result = await baseQuery.where(eq(commits.projectId, projectId));
			return result[0].count;
		}

		const result = await baseQuery;
		return result[0].count;
	}

	/**
	 * コミットの存在確認
	 */
	async exists(projectId: number, sha: string): Promise<boolean> {
		const result = await this.db
			.select({ id: commits.id })
			.from(commits)
			.where(and(eq(commits.projectId, projectId), eq(commits.sha, sha)))
			.limit(1);
		return result.length > 0;
	}

	/**
	 * 最新コミットの取得
	 */
	async getLatest(projectId: number): Promise<Commit | null> {
		const result = await this.db
			.select()
			.from(commits)
			.where(eq(commits.projectId, projectId))
			.orderBy(desc(commits.authorDate))
			.limit(1);
		return result[0] || null;
	}
}
