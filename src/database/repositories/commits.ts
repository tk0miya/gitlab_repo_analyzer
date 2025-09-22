import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/database/connection";
import {
	type Commit,
	commits,
	type NewCommit,
} from "@/database/schema/commits";

/**
 * 統計データの期間タイプ
 */
export type AnalysisPeriod = "monthly" | "weekly";

/**
 * 共通統計データの型定義
 */
export interface CommitStats {
	period: string;
	count: number;
	type: AnalysisPeriod;
}

/**
 * 月別コミット数データ (discriminated union)
 */
export interface MonthlyCommitStats extends Omit<CommitStats, "type"> {
	type: "monthly";
}

/**
 * 週別コミット数データ (discriminated union)
 */
export interface WeeklyCommitStats extends Omit<CommitStats, "type"> {
	type: "weekly";
}

/**
 * コミッターランキングの期間タイプ
 */
export type RankingPeriod = "all" | "year" | "halfYear" | "month";

/**
 * コミッターランキングデータ
 */
export interface CommitterRanking {
	rank: number;
	authorName: string;
	authorEmail: string;
	commitCount: number;
}

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

	/**
	 * プロジェクトの月別コミット数を取得
	 * @param projectId プロジェクトID
	 * @returns 月別コミット数の配列
	 */
	async getMonthlyCommitStats(
		projectId: number,
	): Promise<MonthlyCommitStats[]> {
		const db = await getDb();

		const results = await db
			.select({
				period: sql<string>`TO_CHAR(${commits.authored_date}, 'YYYY-MM')`.as(
					"period",
				),
				count: count().as("count"),
			})
			.from(commits)
			.where(eq(commits.project_id, projectId))
			.groupBy(sql`TO_CHAR(${commits.authored_date}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${commits.authored_date}, 'YYYY-MM')`);

		return results.map((row) => ({
			period: row.period,
			count: Number(row.count),
			type: "monthly" as const,
		}));
	}

	/**
	 * プロジェクトの週別コミット数を取得（直近2年間）
	 * @param projectId プロジェクトID
	 * @returns 週別コミット数の配列
	 */
	async getWeeklyCommitStats(projectId: number): Promise<WeeklyCommitStats[]> {
		const db = await getDb();

		// 直近2年間のデータを取得
		const twoYearsAgo = new Date();
		twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

		const results = await db
			.select({
				period: sql<string>`TO_CHAR(${commits.authored_date}, 'IYYY-IW')`.as(
					"period",
				),
				count: count().as("count"),
			})
			.from(commits)
			.where(
				and(
					eq(commits.project_id, projectId),
					sql`${commits.authored_date} >= ${twoYearsAgo}`,
				),
			)
			.groupBy(sql`TO_CHAR(${commits.authored_date}, 'IYYY-IW')`)
			.orderBy(sql`TO_CHAR(${commits.authored_date}, 'IYYY-IW')`);

		return results.map((row) => ({
			period: row.period,
			count: Number(row.count),
			type: "weekly" as const,
		}));
	}

	/**
	 * プロジェクトのコミッターランキングを取得
	 * @param projectId プロジェクトID
	 * @param period 期間（all: 全期間, year: 1年, halfYear: 半年, month: 1ヶ月）
	 * @param limit 取得件数（デフォルト: 10）
	 * @returns コミッターランキングの配列
	 */
	async getCommitterRanking(
		projectId: number,
		period: RankingPeriod = "all",
		limit: number = 10,
	): Promise<CommitterRanking[]> {
		const db = await getDb();

		// 期間に応じた開始日を計算
		let startDate: Date | null = null;
		const now = new Date();

		switch (period) {
			case "year":
				startDate = new Date(now);
				startDate.setFullYear(now.getFullYear() - 1);
				break;
			case "halfYear":
				startDate = new Date(now);
				startDate.setMonth(now.getMonth() - 6);
				break;
			case "month":
				startDate = new Date(now);
				startDate.setMonth(now.getMonth() - 1);
				break;
			default:
				startDate = null;
				break;
		}

		// WHERE条件の構築
		const whereConditions = [eq(commits.project_id, projectId)];
		if (startDate) {
			whereConditions.push(sql`${commits.authored_date} >= ${startDate}`);
		}

		// コミッターごとのコミット数を集計
		const results = await db
			.select({
				authorName: commits.author_name,
				authorEmail: commits.author_email,
				commitCount: count().as("commit_count"),
			})
			.from(commits)
			.where(and(...whereConditions))
			.groupBy(commits.author_email, commits.author_name)
			.orderBy(desc(count()))
			.limit(limit);

		// ランキング番号を付与
		return results.map((row, index) => ({
			rank: index + 1,
			authorName: row.authorName,
			authorEmail: row.authorEmail,
			commitCount: Number(row.commitCount),
		}));
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
