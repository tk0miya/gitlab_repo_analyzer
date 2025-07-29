import type { SyncStatus, SyncType } from "@/database/schema/sync-logs.js";

/**
 * 同期完了時のパラメータ
 */
export interface CompleteSyncParams {
	records_processed?: number;
	records_added?: number;
}

/**
 * 同期失敗時のパラメータ
 */
export interface FailSyncParams {
	error_message: string;
}

/**
 * 検索条件パラメータ
 */
export interface FindSyncLogsParams {
	project_id?: number;
	sync_type?: SyncType;
	status?: SyncStatus;
	limit?: number;
	offset?: number;
}
