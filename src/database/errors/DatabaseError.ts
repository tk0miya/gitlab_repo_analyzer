/**
 * ベースとなるデータベースエラークラス
 * 全てのデータベース関連エラーはこのクラスを継承する
 */
export class DatabaseError extends Error {
	public readonly timestamp: Date;
	public readonly operation?: string;

	constructor(
		message: string,
		public readonly originalError?: unknown,
		operation?: string,
	) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date();
		this.operation = operation;

		// Error.captureStackTrace が利用可能な場合は使用
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * エラーの詳細情報をオブジェクト形式で取得
	 */
	public toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			timestamp: this.timestamp.toISOString(),
			operation: this.operation,
			originalError:
				this.originalError && typeof this.originalError === "object"
					? { ...this.originalError }
					: this.originalError,
		};
	}

	/**
	 * エラーの詳細情報を文字列形式で取得
	 */
	public toString(): string {
		const parts = [
			`${this.name}: ${this.message}`,
			`Timestamp: ${this.timestamp.toISOString()}`,
		];

		if (this.operation) {
			parts.push(`Operation: ${this.operation}`);
		}

		if (this.originalError) {
			parts.push(`Original Error: ${this.originalError}`);
		}

		return parts.join("\n");
	}
}
