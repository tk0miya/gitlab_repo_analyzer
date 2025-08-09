/**
 * テストデータファクトリ関数のエクスポート
 *
 * このファイルは、すべてのテストデータファクトリ関数への
 * 統一的なアクセスポイントを提供します。
 */

// コミット関連のファクトリ関数（データベース）
export {
	buildCommit,
	buildCommits,
	// build系（インメモリ）
	buildNewCommit,
	buildNewCommits,
	// create系（DB永続化）
	createCommit,
	createCommits,
} from "./database/commits";

// プロジェクト関連のファクトリ関数（データベース）
export {
	// build系（インメモリ）
	buildNewProject,
	buildProject,
	buildProjects,
	buildProjectWithStats,
	// create系（DB永続化）
	createProject,
	createProjects,
} from "./database/projects";

// 同期ログ関連のファクトリ関数（データベース）
export {
	// build系（インメモリ）
	buildNewSyncLog,
	buildSyncLog,
	buildSyncLogs,
	// create系（DB永続化）
	createSyncLog,
	createSyncLogs,
} from "./database/sync-logs";

// GitLab API関連のファクトリ関数
export {
	buildGitLabCommit,
	buildGitLabCommits,
} from "./gitlab_client/commits";

// 今後他のエンティティのファクトリを追加する場合は、ここに追加してください
// 例:
// export { buildUser, createUser } from "./database/users";
// export { buildIssue, createIssue } from "./database/issues";
// export { buildGitLabProject } from "./gitlab_client/projects";
