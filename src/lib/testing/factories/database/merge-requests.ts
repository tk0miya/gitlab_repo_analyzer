import { mergeRequestsRepository } from "@/database/repositories";
import type {
	MergeRequest,
	MergeRequestState,
	NewMergeRequest,
} from "@/database/schema/merge-requests";

/**
 * マージリクエストテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間でマージリクエストデータを一貫して生成するために使用します。
 * build系: インメモリオブジェクトの生成
 * create系: データベースへの永続化を含む操作
 */

let gitlabIdCounter = 100000; // テスト用のGitLab ID開始値
let gitlabIidCounter = 1; // テスト用のGitLab IID開始値
let mergeRequestIdCounter = 1; // 登録済みマージリクエスト用のIDカウンター

/**
 * NewMergeRequestオブジェクトを生成します（インメモリ）
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewMergeRequest オブジェクト
 */
export function buildNewMergeRequest(
	overrides: Partial<NewMergeRequest> = {},
): NewMergeRequest {
	const gitlabId = overrides.gitlab_id ?? gitlabIdCounter++;
	const gitlabIid = overrides.gitlab_iid ?? gitlabIidCounter++;

	return {
		project_id: 1, // デフォルトプロジェクトID（テストで適切なIDに上書きすること）
		gitlab_iid: gitlabIid,
		gitlab_id: gitlabId,
		title: `Test Merge Request ${gitlabIid}`,
		description: `Test merge request description for ${gitlabIid}`,
		state: "opened" as MergeRequestState,
		author_id: 1,
		author_name: "Test Author",
		author_username: "test-author",
		source_branch: `feature/test-${gitlabIid}`,
		target_branch: "main",
		web_url: `https://gitlab.example.com/test/project/-/merge_requests/${gitlabIid}`,
		gitlab_created_at: new Date("2023-01-01T00:00:00Z"),
		gitlab_updated_at: new Date("2023-01-01T00:00:00Z"),
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
	if (overrides.project_id !== undefined)
		newMergeRequestOverrides.project_id = overrides.project_id;
	if (overrides.gitlab_iid !== undefined)
		newMergeRequestOverrides.gitlab_iid = overrides.gitlab_iid;
	if (overrides.gitlab_id !== undefined)
		newMergeRequestOverrides.gitlab_id = overrides.gitlab_id;
	if (overrides.title !== undefined)
		newMergeRequestOverrides.title = overrides.title;
	if (overrides.description !== undefined)
		newMergeRequestOverrides.description = overrides.description;
	if (overrides.state !== undefined)
		newMergeRequestOverrides.state = overrides.state;
	if (overrides.author_id !== undefined)
		newMergeRequestOverrides.author_id = overrides.author_id;
	if (overrides.author_name !== undefined)
		newMergeRequestOverrides.author_name = overrides.author_name;
	if (overrides.author_username !== undefined)
		newMergeRequestOverrides.author_username = overrides.author_username;
	if (overrides.source_branch !== undefined)
		newMergeRequestOverrides.source_branch = overrides.source_branch;
	if (overrides.target_branch !== undefined)
		newMergeRequestOverrides.target_branch = overrides.target_branch;
	if (overrides.web_url !== undefined)
		newMergeRequestOverrides.web_url = overrides.web_url;
	if (overrides.gitlab_created_at !== undefined)
		newMergeRequestOverrides.gitlab_created_at = overrides.gitlab_created_at;
	if (overrides.gitlab_updated_at !== undefined)
		newMergeRequestOverrides.gitlab_updated_at = overrides.gitlab_updated_at;
	if (overrides.merged_at !== undefined)
		newMergeRequestOverrides.merged_at = overrides.merged_at;
	if (overrides.closed_at !== undefined)
		newMergeRequestOverrides.closed_at = overrides.closed_at;

	const baseMergeRequestData = buildNewMergeRequest(newMergeRequestOverrides);

	const result = {
		id,
		created_at: overrides.created_at ?? new Date("2023-01-01T00:00:00Z"),
		...baseMergeRequestData,
		...overrides,
	};

	// undefinedをnullに変換し、型制約を満たす
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
	const newMergeRequest = buildNewMergeRequest(overrides);

	return await mergeRequestsRepository.upsert(newMergeRequest);
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
		const mergeRequestOverrides = { ...overrides };
		if (overrides.title) {
			mergeRequestOverrides.title = `${overrides.title} ${i + 1}`;
		}
		const mergeRequest = await createMergeRequest(mergeRequestOverrides);
		mergeRequests.push(mergeRequest);
	}
	return mergeRequests;
}
