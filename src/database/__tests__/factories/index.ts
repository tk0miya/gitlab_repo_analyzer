/**
 * テストデータファクトリ関数のエクスポート
 *
 * このファイルは、すべてのテストデータファクトリ関数への
 * 統一的なアクセスポイントを提供します。
 */

// コミット関連のファクトリ関数
export {
	createCommitData,
	createMultipleCommitsData,
} from "./commits.js";
// プロジェクト関連のファクトリ関数
export {
	createMultipleProjectsData,
	createProjectData,
} from "./projects.js";

// 同期ログ関連のファクトリ関数
export { createSyncLogData } from "./sync-logs.js";

// 今後他のエンティティのファクトリを追加する場合は、ここに追加してください
// 例:
// export { createUserData, createGroupData } from "./users.js";
// export { createIssueData, createMergeRequestData } from "./gitlab.js";
