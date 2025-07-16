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
import type { GitLabCommit, GitLabCommitsQuery } from "./types/commit.js";
import type { GitLabClientConfig } from "./types/common.js";
import type { GitLabProject } from "./types/project.js";
import type { GitLabUser } from "./types/user.js";

/**
 * GitLab APIクライアント
 */
export class GitLabApiClient {
	private readonly client: AxiosInstance;
	private readonly config: Required<GitLabClientConfig>;

	/**
	 * GitLabApiClientのコンストラクター
	 */
	constructor(config: GitLabClientConfig) {
		// 設定検証
		this.validateConfig(config);

		// デフォルト値を設定
		this.config = {
			timeout: 10000,
			...config,
		};

		// axiosインスタンスを作成
		this.client = axios.create({
			baseURL: this.config.baseUrl,
			timeout: this.config.timeout,
			headers: {
				Authorization: `Bearer ${this.config.token}`,
				"Content-Type": "application/json",
				"User-Agent": "gitlab_repo_analyzer/1.0.0",
			},
		});

		// インターセプターを設定
		this.setupInterceptors();
	}

	/**
	 * 設定を検証
	 */
	private validateConfig(config: GitLabClientConfig): void {
		if (!config.baseUrl) {
			throw new Error("baseUrlが指定されていません");
		}
		if (!config.token) {
			throw new Error("tokenが指定されていません");
		}

		// URLの形式チェック
		try {
			new URL(config.baseUrl);
		} catch {
			throw new Error("baseUrlが無効なURL形式です");
		}
	}

	/**
	 * レスポンス・リクエストインターセプターを設定
	 */
	private setupInterceptors(): void {
		// レスポンスインターセプター（エラーハンドリング）
		this.client.interceptors.response.use(
			(response: AxiosResponse) => response,
			(error: AxiosError) => {
				throw this.handleApiError(error);
			},
		);

		// リクエストインターセプター（ログ記録等）
		this.client.interceptors.request.use(
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
		const response = await this.client.get("/api/v4/user");
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

		const response = await this.client.get(`/api/v4/projects/${encodedId}`);
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

			const response = await this.client.get(url);

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
