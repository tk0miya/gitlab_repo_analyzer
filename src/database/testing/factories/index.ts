/**
 * テストデータファクトリ関数のエクスポート
 *
 * このファイルは、すべてのテストデータファクトリ関数への
 * 統一的なアクセスポイントを提供します。
 */

// コミット関連のファクトリ関数
export {
	buildCommit,
	buildCommits,
	// build系（インメモリ）
	buildNewCommit,
	buildNewCommits,
	// create系（DB永続化）
	createCommit,
	createCommits,
} from "./commits";
// プロジェクト関連のファクトリ関数
export {
	// build系（インメモリ）
	buildNewProject,
	buildProject,
	buildProjects,
	// create系（DB永続化）
	createProject,
	createProjects,
} from "./projects";

// 同期ログ関連のファクトリ関数
export {
	// build系（インメモリ）
	buildNewSyncLog,
	buildSyncLog,
	buildSyncLogs,
	// create系（DB永続化）
	createSyncLog,
	createSyncLogs,
} from "./sync-logs";

// 今後他のエンティティのファクトリを追加する場合は、ここに追加してください
// 例:
// export { buildUser, createUser } from "./users";
// export { buildIssue, createIssue } from "./issues";
