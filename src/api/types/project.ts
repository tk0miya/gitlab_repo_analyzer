/**
 * GitLab Project API型定義
 */

/**
 * GitLabプロジェクト情報
 * GET /api/v4/projects/:id のレスポンス型
 */
export interface GitLabProject {
	id: number;
	description: string | null;
	name: string;
	web_url: string;
	default_branch: string;
	visibility: "public" | "internal" | "private";
	created_at: string;
	path_with_namespace: string;
}
