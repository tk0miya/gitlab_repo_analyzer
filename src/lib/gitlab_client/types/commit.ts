/**
 * GitLab Commit API型定義
 *
 * 参考: https://docs.gitlab.com/ee/api/commits.html
 */

/**
 * GitLabコミット情報
 * GET /api/v4/projects/:id/repository/commits のレスポンス型
 *
 * 参考: https://docs.gitlab.com/ee/api/commits.html#list-repository-commits
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
	web_url: string;
	stats?: GitLabCommitStats;
	parent_ids: string[];
	created_at: string;
}

/**
 * GitLabコミット統計情報
 * --with-stats オプション付きの場合に含まれる
 *
 * 参考: https://docs.gitlab.com/ee/api/commits.html#list-repository-commits
 */
export interface GitLabCommitStats {
	additions: number;
	deletions: number;
	total: number;
}

/**
 * コミット一覧取得用のクエリパラメータ
 *
 * 参考: https://docs.gitlab.com/ee/api/commits.html#list-repository-commits
 */
export interface GitLabCommitsQuery {
	/** ブランチまたはタグ名 */
	ref_name?: string;
	/** 指定日時以降のコミットのみ取得 */
	since?: string;
	/** 指定日時以前のコミットのみ取得 */
	until?: string;
	/** 結果のページ番号 */
	page?: number;
	/** 1ページあたりの件数（1-100、デフォルト: 20） */
	per_page?: number;
	/** 統計情報を含めるかどうか */
	with_stats?: boolean;
	/** ファイルパスを指定してそのファイルに関するコミットのみ取得 */
	path?: string;
	/** 作成者のメールアドレスでフィルタ */
	author?: string;
	/** 全てのコミットを取得するかどうか */
	all?: boolean;
}

/**
 * ページネーション情報を含むコミットリストレスポンス
 *
 * 参考: https://docs.gitlab.com/ee/api/index.html#pagination
 */
export interface GitLabCommitsResponse {
	commits: GitLabCommit[];
	total_count?: number;
	page: number;
	per_page: number;
	has_next_page: boolean;
	has_prev_page: boolean;
}
