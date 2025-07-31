import type { NewSyncLog } from "@/database/schema/sync-logs";
import { SYNC_STATUSES, SYNC_TYPES } from "@/database/schema/sync-logs";

/**
 * 同期ログテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間で同期ログデータを一貫して生成するために使用します。
 * デフォルトの値を提供し、必要に応じて特定のフィールドをオーバーライドできます。
 */

let syncLogCounter = 1; // テスト用の同期ログ生成用カウンタ

/**
 * 基本的な同期ログデータを生成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewSyncLog オブジェクト
 */
export function createSyncLogData(
	overrides: Partial<NewSyncLog> = {},
): NewSyncLog {
	const _uniqueId = syncLogCounter++;

	return {
		project_id: 1, // デフォルトプロジェクトID
		sync_type: SYNC_TYPES.PROJECTS,
		status: SYNC_STATUSES.RUNNING,
		started_at: new Date("2023-01-01T10:00:00Z"),
		completed_at: null,
		records_processed: null,
		records_added: null,
		error_message: null,
		...overrides,
	};
}
