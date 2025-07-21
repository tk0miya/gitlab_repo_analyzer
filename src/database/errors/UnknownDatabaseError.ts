import { DatabaseError } from "./DatabaseError.js";

/**
 * 未知のデータベースエラー
 * 分類できないデータベースエラーに使用
 */
export class UnknownDatabaseError extends DatabaseError {
	public readonly isRetryable: boolean;
	public readonly errorCode?: string;
	public readonly severity?: string;

	constructor(
		message: string = "Unknown database error",
		originalError?: unknown,
		operation?: string,
	) {
		super(message, originalError, operation);

		// PostgreSQL エラーから追加情報を抽出
		if (originalError && typeof originalError === "object") {
			const pgError = originalError as any;
			this.errorCode = pgError.code;
			this.severity = pgError.severity;

			// エラーコードに基づいてリトライ可能性を判定
			this.isRetryable = this.determineRetryability(pgError.code);
		} else {
			this.isRetryable = false;
		}
	}

	/**
	 * PostgreSQLエラーコードからリトライ可能性を判定
	 */
	private determineRetryability(code?: string): boolean {
		if (!code) return false;

		// リトライ可能なエラーコード
		const retryableCodes = new Set([
			"08000", // connection_exception
			"08003", // connection_does_not_exist
			"08006", // connection_failure
			"40001", // serialization_failure
			"40P01", // deadlock_detected
			"53000", // insufficient_resources
			"53100", // disk_full
			"53200", // out_of_memory
			"53300", // too_many_connections
			"57014", // query_canceled
			"57P01", // admin_shutdown
			"57P02", // crash_shutdown
			"57P03", // cannot_connect_now
			"58000", // system_error
			"58030", // io_error
		]);

		return retryableCodes.has(code);
	}

	/**
	 * エラーの詳細分析を取得
	 */
	public getErrorAnalysis(): {
		category: "system" | "resource" | "connection" | "data" | "unknown";
		severity: "low" | "medium" | "high" | "critical" | "unknown";
		isRetryable: boolean;
		recommendation: string;
	} {
		const category = this.categorizeError();
		const severity = this.determineSeverity();
		const recommendation = this.getRecommendation(category);

		return {
			category,
			severity,
			isRetryable: this.isRetryable,
			recommendation,
		};
	}

	/**
	 * エラーをカテゴリに分類
	 */
	private categorizeError():
		| "system"
		| "resource"
		| "connection"
		| "data"
		| "unknown" {
		if (!this.errorCode) return "unknown";

		const code = this.errorCode;

		if (code.startsWith("08")) return "connection";
		if (code.startsWith("53") || code.startsWith("40")) return "resource";
		if (code.startsWith("57") || code.startsWith("58")) return "system";
		if (code.startsWith("22") || code.startsWith("23")) return "data";

		return "unknown";
	}

	/**
	 * エラーの深刻度を判定
	 */
	private determineSeverity():
		| "low"
		| "medium"
		| "high"
		| "critical"
		| "unknown" {
		if (!this.severity) return "unknown";

		switch (this.severity.toLowerCase()) {
			case "panic":
			case "fatal":
				return "critical";
			case "error":
				return "high";
			case "warning":
				return "medium";
			case "notice":
			case "info":
				return "low";
			default:
				return "unknown";
		}
	}

	/**
	 * カテゴリに基づく推奨アクション
	 */
	private getRecommendation(category: string): string {
		switch (category) {
			case "connection":
				return "Check database server status and network connectivity";
			case "resource":
				return "Monitor database resources and consider scaling or optimization";
			case "system":
				return "Contact database administrator or check system logs";
			case "data":
				return "Validate input data and check data constraints";
			default:
				return "Check database logs for detailed error information";
		}
	}

	/**
	 * デバッグ情報をフォーマット
	 */
	public getDebugInfo(): Record<string, unknown> {
		const baseInfo = this.toJSON();
		const analysis = this.getErrorAnalysis();

		return {
			...baseInfo,
			analysis,
			pgErrorCode: this.errorCode,
			pgSeverity: this.severity,
			isRetryable: this.isRetryable,
		};
	}
}
