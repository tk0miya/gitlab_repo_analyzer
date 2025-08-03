import type { SyncType } from "@/database/schema/sync-logs";

/**
 * 検索条件パラメータ
 */
export interface FindSyncLogsParams {
	project_id?: number;
	sync_type?: SyncType;
	limit?: number;
	offset?: number;
}
