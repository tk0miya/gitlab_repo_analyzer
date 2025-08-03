/**
 * GitLab API共通型定義
 */

/**
 * GitLab APIクライアント設定
 */
export interface GitLabClientConfig {
	baseUrl: string;
	token: string;
	timeout?: number;
}
