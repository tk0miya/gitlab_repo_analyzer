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
import type {
	GitLabMergeRequest,
	GitLabMergeRequestsQuery,
} from "./types/merge-request.js";
import type { GitLabNote, GitLabNotesQuery } from "./types/note.js";
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

	// ===== Commits API =====

	/**
	 * プロジェクトのコミット一覧を取得
	 * GET /api/v4/projects/:id/repository/commits
	 */
	async getCommits(
		projectId: string,
		query?: GitLabCommitsQuery,
	): Promise<GitLabCommit[]> {
		const encodedId = encodeURIComponent(projectId);
		const params = new URLSearchParams();

		if (query) {
			// クエリパラメータを設定
			Object.entries(query).forEach(([key, value]) => {
				if (value !== undefined) {
					params.append(key, String(value));
				}
			});
		}

		const url = `/api/v4/projects/${encodedId}/repository/commits`;
		const fullUrl = params.toString() ? `${url}?${params}` : url;

		const response = await this.client.get(fullUrl);
		return response.data;
	}

	/**
	 * プロジェクトの全コミットを自動ページネーションで取得
	 * 大量のコミットが存在する場合に有用
	 */
	async getAllCommits(
		projectId: string,
		query?: Omit<GitLabCommitsQuery, "page" | "per_page">,
	): Promise<GitLabCommit[]> {
		const allCommits: GitLabCommit[] = [];
		let page = 1;
		const perPage = 100; // GitLab APIの最大値

		while (true) {
			const commits = await this.getCommits(projectId, {
				...query,
				page,
				per_page: perPage,
			});

			if (commits.length === 0) {
				break;
			}

			allCommits.push(...commits);

			// ページサイズ未満の結果が返された場合、最後のページと判断
			if (commits.length < perPage) {
				break;
			}

			page++;
		}

		return allCommits;
	}

	// ===== Merge Requests API =====

	/**
	 * プロジェクトのマージリクエスト一覧を取得
	 * GET /api/v4/projects/:id/merge_requests
	 */
	async getMergeRequests(
		projectId: string,
		query?: GitLabMergeRequestsQuery,
	): Promise<GitLabMergeRequest[]> {
		const encodedId = encodeURIComponent(projectId);
		const params = new URLSearchParams();

		if (query) {
			// クエリパラメータを設定
			Object.entries(query).forEach(([key, value]) => {
				if (value !== undefined) {
					if (Array.isArray(value)) {
						// 配列の場合は複数の値を追加
						value.forEach((v) => params.append(key, String(v)));
					} else {
						params.append(key, String(value));
					}
				}
			});
		}

		const url = `/api/v4/projects/${encodedId}/merge_requests`;
		const fullUrl = params.toString() ? `${url}?${params}` : url;

		const response = await this.client.get(fullUrl);
		return response.data;
	}

	/**
	 * 特定のマージリクエスト詳細情報を取得
	 * GET /api/v4/projects/:id/merge_requests/:merge_request_iid
	 */
	async getMergeRequest(
		projectId: string,
		mergeRequestIid: number,
	): Promise<GitLabMergeRequest> {
		const encodedId = encodeURIComponent(projectId);
		const response = await this.client.get(
			`/api/v4/projects/${encodedId}/merge_requests/${mergeRequestIid}`,
		);
		return response.data;
	}

	/**
	 * プロジェクトの全マージリクエストを自動ページネーションで取得
	 * 大量のMRが存在する場合に有用
	 */
	async getAllMergeRequests(
		projectId: string,
		query?: Omit<GitLabMergeRequestsQuery, "page" | "per_page">,
	): Promise<GitLabMergeRequest[]> {
		const allMergeRequests: GitLabMergeRequest[] = [];
		let page = 1;
		const perPage = 100; // GitLab APIの最大値

		while (true) {
			const mergeRequests = await this.getMergeRequests(projectId, {
				...query,
				page,
				per_page: perPage,
			});

			if (mergeRequests.length === 0) {
				break;
			}

			allMergeRequests.push(...mergeRequests);

			// ページサイズ未満の結果が返された場合、最後のページと判断
			if (mergeRequests.length < perPage) {
				break;
			}

			page++;
		}

		return allMergeRequests;
	}

	// ===== Notes API =====

	/**
	 * マージリクエストのノート（コメント）一覧を取得
	 * GET /api/v4/projects/:id/merge_requests/:merge_request_iid/notes
	 */
	async getMergeRequestNotes(
		projectId: string,
		mergeRequestIid: number,
		query?: GitLabNotesQuery,
	): Promise<GitLabNote[]> {
		const encodedId = encodeURIComponent(projectId);
		const params = new URLSearchParams();

		if (query) {
			// クエリパラメータを設定
			Object.entries(query).forEach(([key, value]) => {
				if (value !== undefined) {
					params.append(key, String(value));
				}
			});
		}

		const url = `/api/v4/projects/${encodedId}/merge_requests/${mergeRequestIid}/notes`;
		const fullUrl = params.toString() ? `${url}?${params}` : url;

		const response = await this.client.get(fullUrl);
		return response.data;
	}

	/**
	 * マージリクエストの全ノート（コメント）を自動ページネーションで取得
	 * 大量のコメントが存在する場合に有用
	 */
	async getAllMergeRequestNotes(
		projectId: string,
		mergeRequestIid: number,
		query?: Omit<GitLabNotesQuery, "page" | "per_page">,
	): Promise<GitLabNote[]> {
		const allNotes: GitLabNote[] = [];
		let page = 1;
		const perPage = 100; // GitLab APIの最大値

		while (true) {
			const notes = await this.getMergeRequestNotes(
				projectId,
				mergeRequestIid,
				{
					...query,
					page,
					per_page: perPage,
				},
			);

			if (notes.length === 0) {
				break;
			}

			allNotes.push(...notes);

			// ページサイズ未満の結果が返された場合、最後のページと判断
			if (notes.length < perPage) {
				break;
			}

			page++;
		}

		return allNotes;
	}
}
