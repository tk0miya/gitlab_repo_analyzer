/**
 * GitLab Commits API型定義
 */

/**
 * GitLabコミット情報
 * GET /api/v4/projects/:id/repository/commits のレスポンス型
 */
export interface GitLabCommit {
	id: string;
	short_id: string;
	title: string;
	message: string;
	author_name: string;
	author_email: string;
	authored_date: string;
	committer_name: string;
	committer_email: string;
	committed_date: string;
	created_at: string;
	parent_ids: string[];
	web_url: string;
	stats?: {
		additions: number;
		deletions: number;
		total: number;
	};
}

/**
 * コミット取得のクエリパラメータ
 */
export interface GitLabCommitsQuery {
	ref_name?: string;
	since?: string;
	until?: string;
	path?: string;
	all?: boolean;
	with_stats?: boolean;
	first_parent?: boolean;
	order?: "default" | "topo";
	trailers?: boolean;
	per_page?: number;
	page?: number;
}
