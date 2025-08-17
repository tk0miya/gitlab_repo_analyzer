export { CommitsRepository } from "./commits";
export { MergeRequestsRepository } from "./merge-requests";
export { ProjectsRepository } from "./projects";
export { SyncLogsRepository } from "./sync-logs";

// リポジトリ関連の型定義
export * from "./types/index";

// シングルトンインスタンスをエクスポート
import { CommitsRepository } from "./commits";
import { MergeRequestsRepository } from "./merge-requests";
import { ProjectsRepository } from "./projects";
import { SyncLogsRepository } from "./sync-logs";

export const commitsRepository = new CommitsRepository();
export const mergeRequestsRepository = new MergeRequestsRepository();
export const projectsRepository = new ProjectsRepository();
export const syncLogsRepository = new SyncLogsRepository();
