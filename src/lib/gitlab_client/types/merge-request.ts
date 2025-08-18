/**
 * GitLab Merge Request API型定義
 *
 * 参考: https://docs.gitlab.com/ee/api/merge_requests.html
 */

/**
 * GitLabマージリクエスト情報
 * GET /api/v4/projects/:id/merge_requests のレスポンス型
 *
 * 参考: https://docs.gitlab.com/ee/api/merge_requests.html#list-merge-requests
 */
export interface GitLabMergeRequest {
	id: number;
	iid: number;
	title: string;
	description: string | null;
	state: "opened" | "closed" | "merged";
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	merged_by: GitLabMergeRequestUser | null;
	closed_at: string | null;
	target_branch: string;
	source_branch: string;
	author: GitLabMergeRequestAuthor;
	assignee: GitLabMergeRequestAssignee | null;
	assignees: GitLabMergeRequestAssignee[];
	reviewers: GitLabMergeRequestReviewer[];
	source_project_id: number;
	target_project_id: number;
	web_url: string;
	draft: boolean;
	work_in_progress: boolean;
	milestone: GitLabMergeRequestMilestone | null;
	merge_when_pipeline_succeeds: boolean;
	merge_status: string;
	merge_error: string | null;
	sha: string;
	merge_commit_sha: string | null;
	squash_commit_sha: string | null;
	user_notes_count: number;
	discussion_locked: boolean | null;
	should_remove_source_branch: boolean | null;
	force_remove_source_branch: boolean | null;
	allow_collaboration: boolean;
	allow_maintainer_to_push: boolean;
	squash: boolean;
	time_stats: GitLabMergeRequestTimeStats;
	pipeline: GitLabMergeRequestPipeline | null;
	head_pipeline: GitLabMergeRequestPipeline | null;
	diff_refs: GitLabMergeRequestDiffRefs;
	merge_params: Record<string, unknown> | null;
	subscribed: boolean;
	changes_count: string;
	latest_build_started_at: string | null;
	latest_build_finished_at: string | null;
	first_deployed_to_production_at: string | null;
	has_conflicts: boolean;
	blocking_discussions_resolved: boolean;
	approvals_before_merge: number | null;
}

/**
 * GitLabマージリクエスト作者情報
 */
export interface GitLabMergeRequestAuthor {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string | null;
	web_url: string;
}

/**
 * GitLabマージリクエストアサイニー情報
 */
export interface GitLabMergeRequestAssignee {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string | null;
	web_url: string;
}

/**
 * GitLabマージリクエストレビュワー情報
 */
export interface GitLabMergeRequestReviewer {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string | null;
	web_url: string;
}

/**
 * GitLabマージリクエストユーザー情報（マージ実行者等）
 */
export interface GitLabMergeRequestUser {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string | null;
	web_url: string;
}

/**
 * GitLabマージリクエストマイルストーン情報
 */
export interface GitLabMergeRequestMilestone {
	id: number;
	title: string;
	description: string | null;
	state: string;
	created_at: string;
	updated_at: string;
	group_id: number | null;
	project_id: number;
	web_url: string;
}

/**
 * GitLabマージリクエスト時間統計情報
 */
export interface GitLabMergeRequestTimeStats {
	time_estimate: number;
	total_time_spent: number;
	human_time_estimate: string | null;
	human_total_time_spent: string | null;
}

/**
 * GitLabマージリクエストパイプライン情報
 */
export interface GitLabMergeRequestPipeline {
	id: number;
	sha: string;
	ref: string;
	status: string;
	created_at: string;
	updated_at: string;
	web_url: string;
}

/**
 * GitLabマージリクエストdiff refs情報
 */
export interface GitLabMergeRequestDiffRefs {
	base_sha: string;
	head_sha: string;
	start_sha: string;
}

/**
 * GitLabマージリクエストユーザー情報（マージ実行者用）
 */
export interface GitLabMergeRequestUser {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string | null;
	web_url: string;
}

/**
 * マージリクエスト一覧取得用のクエリパラメータ
 * 差分更新とページネーションに特化した最小限のパラメータセット
 *
 * 参考: https://docs.gitlab.com/ee/api/merge_requests.html#list-merge-requests
 */
export interface GitLabMergeRequestsQuery {
	/** 指定日時以降に更新されたMRのみ取得（差分更新用） */
	updated_after?: string;
	/** ページ番号 */
	page?: number;
	/** 1ページあたりの件数（1-100、デフォルト: 20） */
	per_page?: number;
}

/**
 * ページネーション情報を含むマージリクエストリストレスポンス
 *
 * 参考: https://docs.gitlab.com/ee/api/index.html#pagination
 */
export interface GitLabMergeRequestsResponse {
	merge_requests: GitLabMergeRequest[];
	total_count?: number;
	page: number;
	per_page: number;
	has_next_page: boolean;
	has_prev_page: boolean;
}
