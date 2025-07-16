/**
 * GitLab Repository API型定義
 *
 * 参考: https://docs.gitlab.com/ee/api/repositories.html
 */

/**
 * GitLabリポジトリ統計情報
 * GET /api/v4/projects/:id/repository/contributors のレスポンス型
 *
 * 参考: https://docs.gitlab.com/ee/api/repositories.html#contributors
 */
export interface GitLabContributor {
	name: string;
	email: string;
	commits: number;
	additions: number;
	deletions: number;
}

/**
 * GitLabリポジトリ言語統計
 * GET /api/v4/projects/:id/languages のレスポンス型
 *
 * 参考: https://docs.gitlab.com/ee/api/projects.html#languages
 */
export interface GitLabLanguages {
	[language: string]: number;
}

/**
 * GitLabリポジトリ統計サマリー
 * 複数のエンドポイントから取得した統計情報をまとめたもの
 */
export interface GitLabRepositoryStats {
	/** 総コミット数 */
	total_commits: number;
	/** 総コントリビューター数 */
	total_contributors: number;
	/** 使用言語統計 */
	languages: GitLabLanguages;
	/** コントリビューター一覧 */
	contributors: GitLabContributor[];
	/** 最新コミット情報 */
	latest_commit?: {
		id: string;
		date: string;
		author: string;
		message: string;
	};
	/** 統計取得日時 */
	calculated_at: string;
}

/**
 * GitLabブランチ情報
 * GET /api/v4/projects/:id/repository/branches のレスポンス型
 *
 * 参考: https://docs.gitlab.com/ee/api/branches.html#list-repository-branches
 */
export interface GitLabBranch {
	name: string;
	commit: {
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
	};
	merged: boolean;
	protected: boolean;
	default: boolean;
	developers_can_push: boolean;
	developers_can_merge: boolean;
	can_push: boolean;
	web_url: string;
}

/**
 * GitLabタグ情報
 * GET /api/v4/projects/:id/repository/tags のレスポンス型
 *
 * 参考: https://docs.gitlab.com/ee/api/tags.html#list-project-repository-tags
 */
export interface GitLabTag {
	name: string;
	message: string | null;
	target: string;
	commit: {
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
	};
	release: {
		tag_name: string;
		description: string;
	} | null;
	protected: boolean;
}

/**
 * リポジトリ統計取得用のオプション
 */
export interface GitLabRepositoryStatsOptions {
	/** 統計計算の開始日時 */
	since?: string;
	/** 統計計算の終了日時 */
	until?: string;
	/** 対象ブランチ */
	ref?: string;
	/** 言語統計を含めるかどうか */
	include_languages?: boolean;
	/** コントリビューター情報を含めるかどうか */
	include_contributors?: boolean;
}
