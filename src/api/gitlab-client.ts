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
	 */
	async getCurrentUser(): Promise<GitLabUser> {
		const response = await this.client.get("/api/v4/user");
		return response.data;
	}

	/**
	 * プロジェクト情報を取得
	 * GET /api/v4/projects/:id
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
}
