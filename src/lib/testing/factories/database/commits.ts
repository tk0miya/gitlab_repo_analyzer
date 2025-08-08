import { CommitsRepository } from "@/database/repositories/commits";
import type { Commit, NewCommit } from "@/database/schema/commits";

/**
 * コミットテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間でコミットデータを一貫して生成するために使用します。
 * build系: インメモリオブジェクトの生成
 * create系: データベースへの永続化を含む操作
 */

let shaCounter = 1; // テスト用のSHA生成用カウンタ
let commitIdCounter = 1; // 登録済みコミット用のIDカウンター

/**
 * NewCommitオブジェクトを生成します（インメモリ）
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewCommit オブジェクト
 */
export function buildNewCommit(overrides: Partial<NewCommit> = {}): NewCommit {
	const uniqueId = shaCounter++;
	const sha = overrides.sha ?? `abcdef${uniqueId.toString().padStart(34, "0")}`;

	return {
		project_id: 1, // デフォルトプロジェクトID
		sha,
		message: `テストコミット ${uniqueId}`,
		author_name: "テストユーザー",
		author_email: "test@example.com",
		authored_date: new Date("2023-01-01T10:00:00Z"),
		additions: 10,
		deletions: 5,
		...overrides,
	};
}

/**
 * Commitオブジェクトを生成します（インメモリ、idとcreated_atを含む）
 * @param overrides - オーバーライドしたいフィールド
 * @returns Commit オブジェクト
 */
export function buildCommit(overrides: Partial<Commit> = {}): Commit {
	const id = overrides.id ?? commitIdCounter++;

	// NewCommitに含まれるフィールドのみを抽出
	const newCommitOverrides: Partial<NewCommit> = {};
	if (overrides.project_id !== undefined)
		newCommitOverrides.project_id = overrides.project_id;
	if (overrides.sha !== undefined) newCommitOverrides.sha = overrides.sha;
	if (overrides.message !== undefined)
		newCommitOverrides.message = overrides.message;
	if (overrides.author_name !== undefined)
		newCommitOverrides.author_name = overrides.author_name;
	if (overrides.author_email !== undefined)
		newCommitOverrides.author_email = overrides.author_email;
	if (overrides.authored_date !== undefined)
		newCommitOverrides.authored_date = overrides.authored_date;
	if (overrides.additions !== undefined)
		newCommitOverrides.additions = overrides.additions;
	if (overrides.deletions !== undefined)
		newCommitOverrides.deletions = overrides.deletions;

	const baseCommitData = buildNewCommit(newCommitOverrides);

	const result = {
		id,
		created_at: overrides.created_at ?? new Date("2023-01-01T00:00:00Z"),
		...baseCommitData,
		...overrides,
	};

	// undefinedをnullに変換して型制約を満たす
	return {
		...result,
		additions: result.additions ?? null,
		deletions: result.deletions ?? null,
	};
}

/**
 * 複数のCommitオブジェクトを生成します（インメモリ）
 * @param count - 生成するコミット数
 * @param overrides - 全コミットに適用するオーバーライド
 * @returns Commit配列
 */
export function buildCommits(
	count: number,
	overrides: Partial<Commit> = {},
): Commit[] {
	return Array.from({ length: count }, (_, index) => {
		const commitOverrides = { ...overrides };
		if (overrides.message) {
			commitOverrides.message = `${overrides.message} ${index + 1}`;
		}
		return buildCommit(commitOverrides);
	});
}

/**
 * コミットをデータベースに作成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns 作成されたCommitオブジェクト
 */
export async function createCommit(
	overrides: Partial<NewCommit> = {},
): Promise<Commit> {
	const commitsRepository = new CommitsRepository();
	const newCommit = buildNewCommit(overrides);
	return await commitsRepository.create(newCommit);
}

/**
 * 複数のNewCommitオブジェクトを生成します（インメモリ）
 * @param count - 生成するコミット数
 * @param overrides - 全コミットに適用するオーバーライド
 * @returns NewCommit配列
 */
export function buildNewCommits(
	count: number,
	overrides: Partial<NewCommit> = {},
): NewCommit[] {
	return Array.from({ length: count }, (_, index) => {
		const uniqueId = shaCounter++;
		return buildNewCommit({
			...overrides,
			sha: overrides.sha
				? `${overrides.sha}_${index + 1}`
				: `abcdef${uniqueId.toString().padStart(34, "0")}`,
			message: overrides.message
				? `${overrides.message} ${index + 1}`
				: `テストコミット ${uniqueId}`,
		});
	});
}

/**
 * 複数のコミットをデータベースに作成します
 * @param count - 作成するコミット数
 * @param overrides - 全コミットに適用するオーバーライド
 * @returns 作成されたCommit配列
 */
export async function createCommits(
	count: number,
	overrides: Partial<NewCommit> = {},
): Promise<Commit[]> {
	const commits: Commit[] = [];
	for (let i = 0; i < count; i++) {
		const uniqueId = shaCounter++;
		const commitOverrides = {
			...overrides,
			sha: overrides.sha
				? `${overrides.sha}_${i + 1}`
				: `abcdef${uniqueId.toString().padStart(34, "0")}`,
			message: overrides.message
				? `${overrides.message} ${i + 1}`
				: `テストコミット ${uniqueId}`,
		};
		const commit = await createCommit(commitOverrides);
		commits.push(commit);
	}
	return commits;
}
