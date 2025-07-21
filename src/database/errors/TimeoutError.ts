import { DatabaseError } from "./DatabaseError.js";

/**
 * データベースタイムアウトエラー
 * クエリ実行や接続確立がタイムアウトした場合に発生
 */
export class TimeoutError extends DatabaseError {
	public readonly isRetryable = true;
	public readonly timeoutType:
		| "query"
		| "connection"
		| "transaction"
		| "unknown";

	constructor(
		message: string = "Database operation timeout",
		originalError?: unknown,
		operation?: string,
	) {
		super(message, originalError, operation);
		this.timeoutType = this.determineTimeoutType();
	}

	/**
	 * タイムアウトの種類を判定
	 */
	private determineTimeoutType():
		| "query"
		| "connection"
		| "transaction"
		| "unknown" {
		if (!this.originalError || typeof this.originalError !== "object") {
			return "unknown";
		}

		const pgError = this.originalError as any;
		const message = (pgError.message || "").toLowerCase();
		const code = pgError.code;

		// PostgreSQLエラーコードに基づく判定
		if (code === "57014") {
			// query_canceled
			return "query";
		}

		// メッセージに基づく判定
		if (message.includes("connection") || message.includes("connect")) {
			return "connection";
		} else if (message.includes("transaction")) {
			return "transaction";
		} else if (message.includes("query") || message.includes("statement")) {
			return "query";
		}

		return "unknown";
	}

	/**
	 * タイムアウトの詳細情報を取得
	 */
	public getTimeoutDetails(): {
		type: "query" | "connection" | "transaction" | "unknown";
		duration?: number;
		recommendation: string;
		retryStrategy: "immediate" | "exponential_backoff" | "linear_backoff";
	} {
		let recommendation =
			"Consider optimizing the operation or increasing timeout limits";
		let retryStrategy: "immediate" | "exponential_backoff" | "linear_backoff" =
			"exponential_backoff";

		switch (this.timeoutType) {
			case "query":
				recommendation =
					"Optimize the query or increase query timeout. Consider adding indexes.";
				retryStrategy = "linear_backoff";
				break;
			case "connection":
				recommendation =
					"Check network connectivity or increase connection timeout";
				retryStrategy = "exponential_backoff";
				break;
			case "transaction":
				recommendation =
					"Reduce transaction scope or increase transaction timeout";
				retryStrategy = "immediate";
				break;
		}

		return {
			type: this.timeoutType,
			duration: this.extractDuration(),
			recommendation,
			retryStrategy,
		};
	}

	/**
	 * エラーメッセージからタイムアウト時間を抽出
	 */
	private extractDuration(): number | undefined {
		if (!this.originalError || typeof this.originalError !== "object") {
			return undefined;
		}

		const message = (this.originalError as any).message || "";
		const match = message.match(/(\d+)\s*(ms|milliseconds|s|seconds)/i);

		if (match) {
			const value = parseInt(match[1], 10);
			const unit = match[2].toLowerCase();

			if (unit.startsWith("s")) {
				return value * 1000; // 秒をミリ秒に変換
			}
			return value;
		}

		return undefined;
	}

	/**
	 * 推奨リトライ戦略に基づく待機時間を計算
	 */
	public calculateRetryDelay(
		attempt: number,
		baseDelay: number = 1000,
	): number {
		switch (this.getTimeoutDetails().retryStrategy) {
			case "immediate":
				return 0;
			case "linear_backoff":
				return baseDelay * attempt;
			default:
				return baseDelay * 2 ** (attempt - 1);
		}
	}
}
