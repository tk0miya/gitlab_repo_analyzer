import { DatabaseError } from "./DatabaseError.js";

/**
 * 一意制約違反エラー
 * 既に存在するデータと重複する値を挿入しようとした場合に発生
 */
export class UniqueConstraintError extends DatabaseError {
	public readonly isRetryable = false;
	public readonly constraint?: string;
	public readonly table?: string;
	public readonly column?: string;

	constructor(
		message: string = "Unique constraint violation",
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
		}
	}

	/**
	 * 違反した制約の詳細情報を取得
	 */
	public getConstraintDetails(): {
		constraintName?: string;
		tableName?: string;
		columnName?: string;
		conflictingValue?: string;
		suggestion: string;
	} {
		const suggestion = this.constraint
			? `Update the existing record or use an upsert operation for constraint '${this.constraint}'`
			: "Check for existing records before inserting or use an upsert operation";

		return {
			constraintName: this.constraint,
			tableName: this.table,
			columnName: this.column,
			conflictingValue: this.extractConflictingValue(),
			suggestion,
		};
	}

	/**
	 * エラーメッセージから競合する値を抽出
	 */
	private extractConflictingValue(): string | undefined {
		if (!this.originalError || typeof this.originalError !== "object") {
			return undefined;
		}

		const detail = (this.originalError as any).detail || "";
		const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);

		if (match) {
			return `${match[1]}=${match[2]}`;
		}

		return undefined;
	}

	/**
	 * 特定のテーブル・カラムでの違反かチェック
	 */
	public isConstraintViolation(table: string, column?: string): boolean {
		if (this.table && this.table !== table) {
			return false;
		}

		if (column && this.column && this.column !== column) {
			return false;
		}

		return true;
	}
}
