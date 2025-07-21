import { DatabaseError } from "./DatabaseError.js";

/**
 * 一意制約違反エラー
 * 既に存在するデータと重複する値を挿入しようとした場合に発生
 */
export class UniqueConstraintError extends DatabaseError {
	constructor(
		message: string = "Unique constraint violation",
		originalError?: unknown,
	) {
		super(message, originalError);
	}
}
