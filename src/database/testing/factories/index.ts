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
} from "./commits";
// プロジェクト関連のファクトリ関数
export {
	createMultipleProjectsData,
	createMultipleRegisteredProjectsData,
	createProjectData,
	createRegisteredProjectData,
} from "./projects";

// 同期ログ関連のファクトリ関数
export { createSyncLogData } from "./sync-logs";

// 今後他のエンティティのファクトリを追加する場合は、ここに追加してください
// 例:
// export { createUserData, createGroupData } from "./users";
// export { createIssueData, createMergeRequestData } from "./gitlab";
