/**
 * ベースとなるデータベースエラークラス
 * 全てのデータベース関連エラーはこのクラスを継承する
 */
export class DatabaseError extends Error {
	constructor(
		message: string,
		public readonly originalError?: unknown,
	) {
		super(message);
		this.name = this.constructor.name;

		// Error.captureStackTrace が利用可能な場合は使用
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
