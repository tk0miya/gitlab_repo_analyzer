import { SyncLogsRepository } from "@/database/repositories/sync-logs";
import type { NewSyncLog, SyncLog } from "@/database/schema/sync-logs";
import { SYNC_TYPES } from "@/database/schema/sync-logs";

/**
 * 同期ログテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間で同期ログデータを一貫して生成するために使用します。
 * build系: インメモリオブジェクトの生成
 * create系: データベースへの永続化を含む操作
 */

let syncLogCounter = 1; // テスト用の同期ログ生成用カウンタ
let syncLogIdCounter = 1; // 登録済み同期ログ用のIDカウンター

/**
 * NewSyncLogオブジェクトを生成します（インメモリ）
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewSyncLog オブジェクト
 */
export function buildNewSyncLog(
	overrides: Partial<NewSyncLog> = {},
): NewSyncLog {
	const _uniqueId = syncLogCounter++;

	return {
		project_id: 1, // デフォルトプロジェクトID
		sync_type: SYNC_TYPES.PROJECTS,
		last_item_date: new Date("2023-01-01T09:00:00Z"),
		...overrides,
	};
}

/**
 * SyncLogオブジェクトを生成します（インメモリ、idとcreated_atを含む）
 * @param overrides - オーバーライドしたいフィールド
 * @returns SyncLog オブジェクト
 */
export function buildSyncLog(overrides: Partial<SyncLog> = {}): SyncLog {
	const id = overrides.id ?? syncLogIdCounter++;

	// NewSyncLogに含まれるフィールドのみを抽出
	const newSyncLogOverrides: Partial<NewSyncLog> = {};
	if (overrides.project_id !== undefined)
		newSyncLogOverrides.project_id = overrides.project_id;
	if (overrides.sync_type !== undefined)
		newSyncLogOverrides.sync_type = overrides.sync_type;
	if (overrides.last_item_date !== undefined)
		newSyncLogOverrides.last_item_date = overrides.last_item_date;

	const baseSyncLogData = buildNewSyncLog(newSyncLogOverrides);

	const result = {
		id,
		created_at: overrides.created_at ?? new Date("2023-01-01T00:00:00Z"),
		...baseSyncLogData,
		...overrides,
	};

	// undefinedをデフォルト値に変換して型制約を満たす
	return {
		...result,
		last_item_date: result.last_item_date ?? new Date("2023-01-01T09:00:00Z"),
	};
}

/**
 * 複数のSyncLogオブジェクトを生成します（インメモリ）
 * @param count - 生成する同期ログ数
 * @param overrides - 全同期ログに適用するオーバーライド
 * @returns SyncLog配列
 */
export function buildSyncLogs(
	count: number,
	overrides: Partial<SyncLog> = {},
): SyncLog[] {
	return Array.from({ length: count }, () => {
		return buildSyncLog(overrides);
	});
}

/**
 * 同期ログをデータベースに作成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns 作成されたSyncLogオブジェクト
 */
export async function createSyncLog(
	overrides: Partial<NewSyncLog> = {},
): Promise<SyncLog> {
	const syncLogsRepository = new SyncLogsRepository();
	const newSyncLog = buildNewSyncLog(overrides);
	return await syncLogsRepository.create(newSyncLog);
}

/**
 * 複数の同期ログをデータベースに作成します
 * @param count - 作成する同期ログ数
 * @param overrides - 全同期ログに適用するオーバーライド
 * @returns 作成されたSyncLog配列
 */
export async function createSyncLogs(
	count: number,
	overrides: Partial<NewSyncLog> = {},
): Promise<SyncLog[]> {
	const syncLogs: SyncLog[] = [];
	for (let i = 0; i < count; i++) {
		const syncLog = await createSyncLog(overrides);
		syncLogs.push(syncLog);
	}
	return syncLogs;
}
