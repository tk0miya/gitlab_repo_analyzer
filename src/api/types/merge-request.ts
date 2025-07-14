/**
 * GitLab Merge Requests API型定義
 */

/**
 * GitLabマージリクエスト情報
 * GET /api/v4/projects/:id/merge_requests のレスポンス型
 */
export interface GitLabMergeRequest {
	id: number;
	iid: number;
	project_id: number;
	title: string;
	description: string | null;
	state: "opened" | "closed" | "merged";
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	closed_at: string | null;
	target_branch: string;
	source_branch: string;
	upvotes: number;
	downvotes: number;
	author: GitLabMergeRequestUser;
	assignee: GitLabMergeRequestUser | null;
	assignees: GitLabMergeRequestUser[];
	reviewers: GitLabMergeRequestUser[];
	source_project_id: number;
	target_project_id: number;
	labels: string[];
	draft: boolean;
	work_in_progress: boolean;
	milestone: GitLabMilestone | null;
	merge_when_pipeline_succeeds: boolean;
	merge_status: string;
	merge_error: string | null;
	sha: string;
	merge_commit_sha: string | null;
	squash_commit_sha: string | null;
	user_notes_count: number;
	discussion_locked: boolean | null;
	should_remove_source_branch: boolean | null;
	force_remove_source_branch: boolean;
	allow_collaboration: boolean;
	allow_maintainer_to_push: boolean;
	web_url: string;
	references: {
		short: string;
		relative: string;
		full: string;
	};
	time_stats: {
		time_estimate: number;
		total_time_spent: number;
		human_time_estimate: string | null;
		human_total_time_spent: string | null;
	};
	squash: boolean;
	has_conflicts: boolean;
	blocking_discussions_resolved: boolean;
	approvals_before_merge: number | null;
}

/**
 * GitLabマージリクエストのユーザー情報
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
 * GitLabマイルストーン情報
 */
export interface GitLabMilestone {
	id: number;
	title: string;
	description: string | null;
	state: "active" | "closed";
	created_at: string;
	updated_at: string;
	group_id: number | null;
	project_id: number;
	web_url: string;
}

/**
 * マージリクエスト取得のクエリパラメータ
 */
export interface GitLabMergeRequestsQuery {
	state?: "opened" | "closed" | "merged" | "all";
	order_by?: "created_at" | "updated_at";
	sort?: "asc" | "desc";
	milestone?: string;
	view?: "simple";
	labels?: string;
	with_labels_details?: boolean;
	with_merge_status_recheck?: boolean;
	created_after?: string;
	created_before?: string;
	updated_after?: string;
	updated_before?: string;
	scope?: "created_by_me" | "assigned_to_me" | "all";
	author_id?: number;
	author_username?: string;
	assignee_id?: number;
	assignee_username?: string;
	my_reaction_emoji?: string;
	source_branch?: string;
	target_branch?: string;
	search?: string;
	in?: string;
	draft?: boolean;
	wip?: "yes" | "no";
	not?: Record<string, unknown>;
	environment?: string;
	deployed_before?: string;
	deployed_after?: string;
	per_page?: number;
	page?: number;
}
