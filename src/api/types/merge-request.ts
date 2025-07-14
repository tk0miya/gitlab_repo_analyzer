/**
 * GitLab Merge Requests API型定義
 */

/**
 * GitLabマージリクエスト情報（分析用最適化版）
 * GET /api/v4/projects/:id/merge_requests のレスポンス型
 */
export interface GitLabMergeRequest {
	// 必須識別子
	id: number;
	iid: number;
	project_id: number;

	// 基本情報
	title: string;
	description: string | null;
	state: "opened" | "closed" | "merged";

	// 時間情報（分析の核心）
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	closed_at: string | null;

	// ブランチ情報
	target_branch: string;
	source_branch: string;

	// 人的情報（チーム分析用）
	author: GitLabMergeRequestUser;
	assignees: GitLabMergeRequestUser[];
	reviewers: GitLabMergeRequestUser[];

	// メトリクス（エンゲージメント分析用）
	upvotes: number;
	downvotes: number;
	user_notes_count: number;

	// 作業時間統計（生産性分析用）
	time_stats?: {
		time_estimate: number;
		total_time_spent: number;
		human_time_estimate: string | null;
		human_total_time_spent: string | null;
	};

	// 状態フラグ
	draft: boolean;
	has_conflicts: boolean;

	// 参照URL
	web_url: string;

	// コミット情報
	sha: string;
	merge_commit_sha: string | null;
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
