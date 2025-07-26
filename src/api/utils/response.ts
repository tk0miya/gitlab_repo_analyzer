/**
 * API レスポンス共通ユーティリティ
 */

import type {
	ApiError,
	ApiErrorResponse,
	ApiResponse,
	ApiSuccessResponse,
	ValidationError,
} from "../../types/api.js";

/**
 * 成功レスポンスを作成する
 */
export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
	return {
		success: true,
		timestamp: new Date().toISOString(),
		data,
	};
}

/**
 * エラーレスポンスを作成する
 */
export function createErrorResponse(
	message: string,
	details?: string,
	validationErrors?: ValidationError[],
): ApiErrorResponse {
	const error: ApiError = {
		message,
		...(details && { details }),
		...(validationErrors && { validation_errors: validationErrors }),
	};

	return {
		success: false,
		timestamp: new Date().toISOString(),
		error,
	};
}

/**
 * Zodエラーの型定義
 */
interface ZodErrorIssue {
	path: (string | number)[];
	message: string;
	received?: unknown;
}

interface ZodError {
	errors?: ZodErrorIssue[];
}

/**
 * Zodのバリデーションエラーを変換する
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
	if (!error.errors || !Array.isArray(error.errors)) {
		return [];
	}

	return error.errors.map((err: ZodErrorIssue) => ({
		field: err.path.join("."),
		message: err.message,
		value: err.received,
	}));
}

/**
 * エラーかどうかを判定する（型ガード）
 */
export function isErrorResponse(
	response: ApiResponse,
): response is ApiErrorResponse {
	return !response.success;
}

/**
 * 成功レスポンスかどうかを判定する（型ガード）
 */
export function isSuccessResponse<T>(
	response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
	return response.success;
}

/**
 * 共通エラーメッセージ
 */
export const ERROR_MESSAGES = {
	VALIDATION_FAILED: "入力内容に不正があります",
	NOT_FOUND: "リソースが見つかりません",
	BAD_REQUEST: "リクエストの形式が不正です",
	INTERNAL_ERROR: "サーバー内部でエラーが発生しました",
} as const;
