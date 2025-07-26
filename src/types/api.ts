/**
 * API共通型定義
 * 統一されたレスポンス形式とエラーハンドリング
 */

/**
 * APIレスポンスの基本構造
 */
export interface BaseApiResponse {
	/** リクエストが成功したかどうか */
	success: boolean;
	/** レスポンスのタイムスタンプ */
	timestamp: string;
}

/**
 * 成功レスポンス
 */
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
	success: true;
	/** レスポンスデータ */
	data: T;
}

/**
 * エラーレスポンス
 */
export interface ApiErrorResponse extends BaseApiResponse {
	success: false;
	/** エラー情報 */
	error: ApiError;
}

/**
 * APIエラー情報
 */
export interface ApiError {
	/** エラーメッセージ */
	message: string;
	/** 詳細なエラー情報（開発用） */
	details?: string;
	/** バリデーションエラーの場合のフィールド別エラー */
	validation_errors?: ValidationError[];
}

/**
 * バリデーションエラー
 */
export interface ValidationError {
	/** フィールド名 */
	field: string;
	/** エラーメッセージ */
	message: string;
	/** 入力された値 */
	value?: unknown;
}

/**
 * HTTPステータスコード
 */
export enum HttpStatusCode {
	// 成功
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,

	// クライアントエラー
	BAD_REQUEST = 400,
	NOT_FOUND = 404,
	UNPROCESSABLE_ENTITY = 422,

	// サーバーエラー
	INTERNAL_SERVER_ERROR = 500,
}

/**
 * APIレスポンス型（成功またはエラー）
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * プロジェクト関連のAPIレスポンス型
 */
export type ProjectListResponse = ApiSuccessResponse<Project[]>;
export type ProjectDetailResponse = ApiSuccessResponse<Project>;
export type ProjectCreateResponse = ApiSuccessResponse<Project>;
export type ProjectUpdateResponse = ApiSuccessResponse<Project>;
// プロジェクト削除は204 No Contentを返すため、レスポンス型は不要

/**
 * プロジェクト型定義（データベーススキーマから継承）
 */
export interface Project {
	/** 内部ID */
	id: number;
	/** GitLab プロジェクトID */
	gitlab_id: number;
	/** プロジェクト名 */
	name: string;
	/** プロジェクト説明 */
	description: string | null;
	/** プロジェクトのWebURL */
	web_url: string;
	/** デフォルトブランチ */
	default_branch: string;
	/** 可視性設定 */
	visibility: "public" | "internal" | "private";
	/** 内部作成日時 */
	created_at: Date;
	/** GitLab上での作成日時 */
	gitlab_created_at: Date;
}
