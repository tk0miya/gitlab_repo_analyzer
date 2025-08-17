/**
 * GitLab API クライアント エクスポート
 */

// メインクライアント
export { GitLabApiClient } from "./gitlab-client";

// シングルトンインスタンス
import { GitLabApiClient } from "./gitlab-client";
export const gitLabApiClient = new GitLabApiClient();
// コミット関連の型定義
export type {
	GitLabCommit,
	GitLabCommitStats,
	GitLabCommitsQuery,
	GitLabCommitsResponse,
} from "./types/commit";
// 型定義
export type { GitLabClientConfig } from "./types/common";
// マージリクエスト関連の型定義
export type {
	GitLabMergeRequest,
	GitLabMergeRequestAssignee,
	GitLabMergeRequestAuthor,
	GitLabMergeRequestDiffRefs,
	GitLabMergeRequestMilestone,
	GitLabMergeRequestPipeline,
	GitLabMergeRequestReviewer,
	GitLabMergeRequestsQuery,
	GitLabMergeRequestsResponse,
	GitLabMergeRequestTimeStats,
} from "./types/merge-request";
export type { GitLabProject } from "./types/project";
// リポジトリ関連の型定義
export type {
	GitLabBranch,
	GitLabContributor,
	GitLabLanguages,
	GitLabRepositoryStats,
	GitLabRepositoryStatsOptions,
	GitLabTag,
} from "./types/repository";
export type { GitLabUser } from "./types/user";
