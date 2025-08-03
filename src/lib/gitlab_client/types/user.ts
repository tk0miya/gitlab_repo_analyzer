/**
 * GitLab User API型定義
 */

/**
 * GitLab現在ユーザー情報
 * GET /api/v4/user のレスポンス型
 */
export interface GitLabUser {
	id: number;
	username: string;
	name: string;
}
