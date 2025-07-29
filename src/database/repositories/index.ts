export { CommitsRepository } from "./commits.js";
export { ProjectsRepository } from "./projects.js";
export { SyncLogsRepository } from "./sync-logs.js";

// リポジトリ関連の型定義
export * from "./types/index.js";

// シングルトンインスタンスをエクスポート
import { CommitsRepository } from "./commits.js";
import { ProjectsRepository } from "./projects.js";
import { SyncLogsRepository } from "./sync-logs.js";

export const commitsRepository = new CommitsRepository();
export const projectsRepository = new ProjectsRepository();
export const syncLogsRepository = new SyncLogsRepository();
