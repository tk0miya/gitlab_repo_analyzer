import { DatabaseError } from "./DatabaseError.js";

/**
 * データベース接続エラー
 * ネットワーク問題や接続プール不足など、接続に関連するエラー
 */
export class ConnectionError extends DatabaseError {
	public readonly isRetryable = true;

	constructor(
		message: string = "Database connection error",
		originalError?: unknown,
		operation?: string,
	) {
		super(message, originalError, operation);
	}

	/**
	 * 接続エラーの詳細分析
	 */
	public getConnectionDetails(): {
		isNetworkError: boolean;
		isTimeoutError: boolean;
		isPoolExhausted: boolean;
		suggestedAction: string;
	} {
		const errorMessage =
			this.originalError && typeof this.originalError === "object"
				? (this.originalError as any).message || ""
				: String(this.originalError || "");

		const code =
			this.originalError && typeof this.originalError === "object"
				? (this.originalError as any).code
				: undefined;

		const isNetworkError =
			errorMessage.includes("ECONNREFUSED") ||
			errorMessage.includes("ENOTFOUND") ||
			errorMessage.includes("EHOSTUNREACH");

		const isTimeoutError =
			errorMessage.includes("timeout") || code === "ETIMEDOUT";

		const isPoolExhausted =
			errorMessage.includes("pool") ||
			code === "53300" || // too_many_connections
			errorMessage.includes("too many");

		let suggestedAction =
			"Check database server status and network connectivity";

		if (isNetworkError) {
			suggestedAction =
				"Verify database server is running and network is accessible";
		} else if (isTimeoutError) {
			suggestedAction = "Check network latency or increase connection timeout";
		} else if (isPoolExhausted) {
			suggestedAction =
				"Increase connection pool size or check for connection leaks";
		}

		return {
			isNetworkError,
			isTimeoutError,
			isPoolExhausted,
			suggestedAction,
		};
	}
}
