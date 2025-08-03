/**
 * GitLab APIクライアント
 */

import type {
	AxiosError,
	AxiosInstance,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import { loadConfig } from "@/config/index";
import type { GitLabCommit, GitLabCommitsQuery } from "./types/commit";
import type { GitLabProject } from "./types/project";
import type { GitLabUser } from "./types/user";

/**
 * GitLab APIクライアント
 */
export class GitLabApiClient {
	private client?: AxiosInstance;

	/**
	 * 設定を読み込んでAxiosクライアントを取得
	 */
	private async getClient(): Promise<AxiosInstance> {
		if (!this.client) {
			const config = await loadConfig();

			// axiosインスタンスを作成
			this.client = axios.create({
				baseURL: config.gitlab.url,
				timeout: config.gitlab.timeout,
				headers: {
					Authorization: `Bearer ${config.gitlab.token}`,
					"Content-Type": "application/json",
					"User-Agent": "gitlab_repo_analyzer/1.0.0",
				},
			});

			// インターセプターを設定
			this.setupInterceptors(this.client);
		}
		return this.client;
	}

	/**
	 * レスポンス・リクエストインターセプターを設定
	 */
	private setupInterceptors(client: AxiosInstance): void {
		// レスポンスインターセプター（エラーハンドリング）
		client.interceptors.response.use(
			(response: AxiosResponse) => response,
			(error: AxiosError) => {
				throw this.handleApiError(error);
			},
		);

		// リクエストインターセプター（ログ記録等）
		client.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				// デバッグログ（本番環境では無効化）
				if (process.env.NODE_ENV === "development") {
					console.debug(
						`GitLab API Request: ${config.method?.toUpperCase()} ${config.url}`,
					);
				}
				return config;
			},
			(error: AxiosError) => Promise.reject(error),
		);
	}

	/**
	 * APIエラーを適切なエラークラスに変換
	 */
	private handleApiError(error: AxiosError): Error {
		// ネットワークエラーの場合
		if (!error.response) {
			return new Error(`ネットワークエラー: ${error.message}`);
		}

		const { status, data } = error.response;
		const errorMessage = this.extractErrorMessage(data);

		return new Error(`GitLab API エラー (${status}): ${errorMessage}`);
	}

	/**
	 * エラーレスポンスからメッセージを抽出
	 */
	private extractErrorMessage(data: unknown): string {
		if (typeof data === "object" && data !== null) {
			const errorData = data as Record<string, unknown>;
			if (typeof errorData.message === "string") {
				return errorData.message;
			}
			if (typeof errorData.error_description === "string") {
				return errorData.error_description;
			}
			if (typeof errorData.error === "string") {
				return errorData.error;
			}
		}
		return "GitLab APIエラーが発生しました";
	}

	/**
	 * 現在のユーザー情報を取得
	 * GET /api/v4/user
	 *
	 * 参考: https://docs.gitlab.com/ee/api/users.html#for-user
	 */
	async getCurrentUser(): Promise<GitLabUser> {
		const client = await this.getClient();
		const response = await client.get("/api/v4/user");
		return response.data;
	}

	/**
	 * プロジェクト情報を取得
	 * GET /api/v4/projects/:id
	 *
	 * 参考: https://docs.gitlab.com/ee/api/projects.html#get-single-project
	 */
	async getProject(id: string): Promise<GitLabProject> {
		// プロジェクトIDをURLエンコード
		const encodedId = encodeURIComponent(id);

		const client = await this.getClient();
		const response = await client.get(`/api/v4/projects/${encodedId}`);
		return response.data;
	}

	/**
	 * 接続テスト（getCurrentUserのエイリアス）
	 */
	async testConnection(): Promise<boolean> {
		try {
			await this.getCurrentUser();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * プロジェクトのコミット一覧を取得（ジェネレータ）
	 * GET /api/v4/projects/:id/repository/commits
	 *
	 * 参考: https://docs.gitlab.com/ee/api/commits.html#list-repository-commits
	 */
	async *getCommits(
		projectId: string,
		options: GitLabCommitsQuery = {},
	): AsyncGenerator<GitLabCommit[], void, unknown> {
		const encodedId = encodeURIComponent(projectId);
		const client = await this.getClient();

		// デフォルト値を設定
		const defaultOptions = {
			per_page: 20,
			page: 1,
			...options,
		};

		let currentPage = defaultOptions.page;

		while (true) {
			// クエリパラメータを構築
			const params = new URLSearchParams();
			if (defaultOptions.ref_name)
				params.append("ref_name", defaultOptions.ref_name);
			if (defaultOptions.since) params.append("since", defaultOptions.since);
			if (defaultOptions.until) params.append("until", defaultOptions.until);
			params.append("page", currentPage.toString());
			params.append("per_page", defaultOptions.per_page.toString());
			if (defaultOptions.with_stats) params.append("with_stats", "true");
			if (defaultOptions.path) params.append("path", defaultOptions.path);
			if (defaultOptions.author) params.append("author", defaultOptions.author);
			if (defaultOptions.all) params.append("all", "true");

			const url = `/api/v4/projects/${encodedId}/repository/commits${
				params.toString() ? `?${params.toString()}` : ""
			}`;

			const response = await client.get(url);

			// コミットがない場合は終了
			if (!response.data || response.data.length === 0) {
				break;
			}

			yield response.data;

			// 次のページがない場合は終了
			const nextPage = response.headers["x-next-page"];
			if (!nextPage) {
				break;
			}

			currentPage++;
		}
	}
}
