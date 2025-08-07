import { transaction } from "@/database/connection";

/**
 * テスト用の強制ロールバックエラー
 * withTransaction内部でのみ使用される
 */
class TestTransactionRollbackError extends Error {
	constructor() {
		super("Test transaction rollback");
		this.name = "TestTransactionRollbackError";
	}
}

/**
 * テスト用トランザクション内でコードを実行し、自動的にロールバックするユーティリティ関数
 * 本番用のtransaction()を使用して、強制ロールバック機能を追加
 * テストや一時的な操作で使用する
 */
export async function withTransaction(
	testFn: () => Promise<void>,
): Promise<void> {
	try {
		await transaction(async () => {
			// testFnを実行
			await testFn();
			// テスト用：強制的にロールバックするためにエラーを投げる
			throw new TestTransactionRollbackError();
		});
	} catch (error) {
		// ロールバック用の例外は無視、それ以外は再スロー
		if (!(error instanceof TestTransactionRollbackError)) {
			throw error;
		}
	}
}
