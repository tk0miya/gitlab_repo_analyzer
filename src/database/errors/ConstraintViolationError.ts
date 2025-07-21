import { DatabaseError } from "./DatabaseError.js";

/**
 * 制約違反エラー（一意制約以外）
 * 外部キー制約、NOT NULL制約、CHECK制約の違反時に発生
 */
export class ConstraintViolationError extends DatabaseError {
	public readonly isRetryable = false;
	public readonly constraint?: string;
	public readonly table?: string;
	public readonly column?: string;
	public readonly constraintType?:
		| "foreign_key"
		| "not_null"
		| "check"
		| "unknown";

	constructor(
		message: string = "Constraint violation",
		originalError?: unknown,
		operation?: string,
	) {
		super(message, originalError, operation);

		// PostgreSQL エラーから制約情報を抽出
		if (originalError && typeof originalError === "object") {
			const pgError = originalError as any;
			this.constraint = pgError.constraint;
			this.table = pgError.table;
			this.column = pgError.column;
			this.constraintType = this.determineConstraintType(pgError.code);
		}
	}

	/**
	 * PostgreSQLエラーコードから制約タイプを判定
	 */
	private determineConstraintType(
		code?: string,
	): "foreign_key" | "not_null" | "check" | "unknown" {
		switch (code) {
			case "23503":
				return "foreign_key";
			case "23502":
				return "not_null";
			case "23514":
				return "check";
			default:
				return "unknown";
		}
	}

	/**
	 * 制約違反の詳細情報を取得
	 */
	public getViolationDetails(): {
		type: "foreign_key" | "not_null" | "check" | "unknown";
		constraintName?: string;
		tableName?: string;
		columnName?: string;
		suggestion: string;
	} {
		let suggestion = "Check the data integrity requirements";

		switch (this.constraintType) {
			case "foreign_key":
				suggestion = `Ensure the referenced record exists in the parent table`;
				break;
			case "not_null":
				suggestion = `Provide a value for the required field '${this.column || "unknown"}'`;
				break;
			case "check":
				suggestion = `Ensure the data meets the check constraint requirements`;
				break;
		}

		return {
			type: this.constraintType || "unknown",
			constraintName: this.constraint,
			tableName: this.table,
			columnName: this.column,
			suggestion,
		};
	}

	/**
	 * 外部キー制約違反かどうか
	 */
	public isForeignKeyViolation(): boolean {
		return this.constraintType === "foreign_key";
	}

	/**
	 * NOT NULL制約違反かどうか
	 */
	public isNotNullViolation(): boolean {
		return this.constraintType === "not_null";
	}

	/**
	 * CHECK制約違反かどうか
	 */
	public isCheckViolation(): boolean {
		return this.constraintType === "check";
	}
}
