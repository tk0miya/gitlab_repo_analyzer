import { MergeRequestsRepository } from "@/database/repositories/merge-requests";
import type {
	MergeRequest,
	NewMergeRequest,
} from "@/database/schema/merge-requests";

/**
 * マージリクエストテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間でマージリクエストデータを一貫して生成するために使用します。
 * build系: インメモリオブジェクトの生成
 * create系: データベースへの永続化を含む操作
 */

let iidCounter = 1; // テスト用のIID生成用カウンタ
let gitlabIdCounter = 1000; // テスト用のGitLab ID生成用カウンタ
let mergeRequestIdCounter = 1; // 登録済みマージリクエスト用のIDカウンター

/**
 * NewMergeRequestオブジェクトを生成します（インメモリ）
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewMergeRequest オブジェクト
 */
export function buildNewMergeRequest(
	overrides: Partial<NewMergeRequest> = {},
): NewMergeRequest {
	const uniqueIid = iidCounter++;
	const uniqueGitlabId = gitlabIdCounter++;

	return {
		project_id: 1, // デフォルトプロジェクトID
		gitlab_iid: uniqueIid,
		gitlab_id: uniqueGitlabId,
		title: `テストMR ${uniqueIid}`,
		description: `テストマージリクエストの説明 ${uniqueIid}`,
		state: "opened",
		author_id: 100,
		author_name: "テストユーザー",
		author_username: "test-user",
		source_branch: `feature/test-${uniqueIid}`,
		target_branch: "main",
		web_url: `https://gitlab.example.com/project/-/merge_requests/${uniqueIid}`,
		gitlab_created_at: new Date("2023-01-01T10:00:00Z"),
		gitlab_updated_at: new Date("2023-01-01T10:00:00Z"),
		merged_at: null,
		closed_at: null,
		...overrides,
	};
}

/**
 * MergeRequestオブジェクトを生成します（インメモリ、idとcreated_atを含む）
 * @param overrides - オーバーライドしたいフィールド
 * @returns MergeRequest オブジェクト
 */
export function buildMergeRequest(
	overrides: Partial<MergeRequest> = {},
): MergeRequest {
	const id = overrides.id ?? mergeRequestIdCounter++;

	// NewMergeRequestに含まれるフィールドのみを抽出
	const newMergeRequestOverrides: Partial<NewMergeRequest> = {};
	const fieldsToExtract = [
		"project_id",
		"gitlab_iid",
		"gitlab_id",
		"title",
		"description",
		"state",
		"author_id",
		"author_name",
		"author_username",
		"source_branch",
		"target_branch",
		"web_url",
		"gitlab_created_at",
		"gitlab_updated_at",
		"merged_at",
		"closed_at",
	] as const;

	for (const field of fieldsToExtract) {
		if (overrides[field] !== undefined) {
			// 型安全性を保持しつつフィールドをコピー
			const value = overrides[field];
			switch (field) {
				case "project_id":
					newMergeRequestOverrides.project_id = value as number;
					break;
				case "gitlab_iid":
					newMergeRequestOverrides.gitlab_iid = value as number;
					break;
				case "gitlab_id":
					newMergeRequestOverrides.gitlab_id = value as number;
					break;
				case "title":
					newMergeRequestOverrides.title = value as string;
					break;
				case "description":
					newMergeRequestOverrides.description = value as string | null;
					break;
				case "state":
					newMergeRequestOverrides.state = value as
						| "opened"
						| "closed"
						| "merged";
					break;
				case "author_id":
					newMergeRequestOverrides.author_id = value as number;
					break;
				case "author_name":
					newMergeRequestOverrides.author_name = value as string;
					break;
				case "author_username":
					newMergeRequestOverrides.author_username = value as string;
					break;
				case "source_branch":
					newMergeRequestOverrides.source_branch = value as string;
					break;
				case "target_branch":
					newMergeRequestOverrides.target_branch = value as string;
					break;
				case "web_url":
					newMergeRequestOverrides.web_url = value as string;
					break;
				case "gitlab_created_at":
					newMergeRequestOverrides.gitlab_created_at = value as Date;
					break;
				case "gitlab_updated_at":
					newMergeRequestOverrides.gitlab_updated_at = value as Date;
					break;
				case "merged_at":
					newMergeRequestOverrides.merged_at = value as Date | null;
					break;
				case "closed_at":
					newMergeRequestOverrides.closed_at = value as Date | null;
					break;
			}
		}
	}

	const baseMergeRequestData = buildNewMergeRequest(newMergeRequestOverrides);

	const result = {
		id,
		created_at: overrides.created_at ?? new Date("2023-01-01T00:00:00Z"),
		...baseMergeRequestData,
		...overrides,
	};

	// undefinedをnullに変換して型制約を満たす
	return {
		...result,
		description: result.description ?? null,
		merged_at: result.merged_at ?? null,
		closed_at: result.closed_at ?? null,
	};
}

/**
 * 複数のMergeRequestオブジェクトを生成します（インメモリ）
 * @param count - 生成するマージリクエスト数
 * @param overrides - 全マージリクエストに適用するオーバーライド
 * @returns MergeRequest配列
 */
export function buildMergeRequests(
	count: number,
	overrides: Partial<MergeRequest> = {},
): MergeRequest[] {
	return Array.from({ length: count }, (_, index) => {
		const mergeRequestOverrides = { ...overrides };
		if (overrides.title) {
			mergeRequestOverrides.title = `${overrides.title} ${index + 1}`;
		}
		return buildMergeRequest(mergeRequestOverrides);
	});
}

/**
 * マージリクエストをデータベースに作成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns 作成されたMergeRequestオブジェクト
 */
export async function createMergeRequest(
	overrides: Partial<NewMergeRequest> = {},
): Promise<MergeRequest> {
	const mergeRequestsRepository = new MergeRequestsRepository();
	const newMergeRequest = buildNewMergeRequest(overrides);
	return await mergeRequestsRepository.create(newMergeRequest);
}

/**
 * 複数のNewMergeRequestオブジェクトを生成します（インメモリ）
 * @param count - 生成するマージリクエスト数
 * @param overrides - 全マージリクエストに適用するオーバーライド
 * @returns NewMergeRequest配列
 */
export function buildNewMergeRequests(
	count: number,
	overrides: Partial<NewMergeRequest> = {},
): NewMergeRequest[] {
	return Array.from({ length: count }, (_, index) => {
		const uniqueIid = iidCounter++;
		return buildNewMergeRequest({
			...overrides,
			gitlab_iid: overrides.gitlab_iid
				? overrides.gitlab_iid + index
				: uniqueIid,
			title: overrides.title
				? `${overrides.title} ${index + 1}`
				: `テストMR ${uniqueIid}`,
		});
	});
}

/**
 * 複数のマージリクエストをデータベースに作成します
 * @param count - 作成するマージリクエスト数
 * @param overrides - 全マージリクエストに適用するオーバーライド
 * @returns 作成されたMergeRequest配列
 */
export async function createMergeRequests(
	count: number,
	overrides: Partial<NewMergeRequest> = {},
): Promise<MergeRequest[]> {
	const mergeRequests: MergeRequest[] = [];
	for (let i = 0; i < count; i++) {
		const uniqueIid = iidCounter++;
		const mergeRequestOverrides = {
			...overrides,
			gitlab_iid: overrides.gitlab_iid ? overrides.gitlab_iid + i : uniqueIid,
			title: overrides.title
				? `${overrides.title} ${i + 1}`
				: `テストMR ${uniqueIid}`,
		};
		const mergeRequest = await createMergeRequest(mergeRequestOverrides);
		mergeRequests.push(mergeRequest);
	}
	return mergeRequests;
}
