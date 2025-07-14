/**
 * GitLab API クライアント エクスポート
 */

// メインクライアント
export { GitLabApiClient } from "./gitlab-client.js";
// Commits API
export type {
	GitLabCommit,
	GitLabCommitsQuery,
	GitLabContributor,
} from "./types/commit.js";
// 型定義
export type { GitLabClientConfig } from "./types/common.js";
// Merge Requests API
export type {
	GitLabMergeRequest,
	GitLabMergeRequestsQuery,
	GitLabMergeRequestUser,
	GitLabMilestone,
} from "./types/merge-request.js";
// Notes API
export type {
	GitLabCreateNoteRequest,
	GitLabNote,
	GitLabNoteAuthor,
	GitLabNotesQuery,
} from "./types/note.js";
export type { GitLabProject } from "./types/project.js";
export type { GitLabUser } from "./types/user.js";
