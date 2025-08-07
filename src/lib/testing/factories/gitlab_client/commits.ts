/**
 * GitLab APIのコミットデータのモック生成ヘルパー
 */

import type { GitLabCommit } from "@/lib/gitlab_client/types/commit";

let gitlabCommitIdCounter = 1;
// 基準日時: 2025/1/1 00:00:00 UTC
const baseDate = new Date("2025-01-01T00:00:00Z");

/**
 * GitLabCommitオブジェクトのモックを生成
 * @param overrides - オーバーライドしたいフィールド
 * @returns GitLabCommitオブジェクト
 */
export function buildGitLabCommit(
	overrides: Partial<GitLabCommit> = {},
): GitLabCommit {
	const uniqueId = gitlabCommitIdCounter++;
	const id = overrides.id ?? `abc${uniqueId.toString().padStart(37, "0")}`;
	const shortId = overrides.short_id ?? id.substring(0, 8);
	// 基準日時から1秒ずつずらした時間を生成
	const commitDate = new Date(baseDate.getTime() + (uniqueId - 1) * 1000);
	const commitDateISO = commitDate.toISOString();

	return {
		id,
		short_id: shortId,
		title:
			overrides.title ??
			overrides.message?.split("\n")[0] ??
			`Commit ${uniqueId}`,
		message:
			overrides.message ?? `Commit ${uniqueId}\n\nThis is a test commit.`,
		author_name: overrides.author_name ?? "Test User",
		author_email: overrides.author_email ?? "test@example.com",
		authored_date: overrides.authored_date ?? commitDateISO,
		committer_name:
			overrides.committer_name ?? overrides.author_name ?? "Test User",
		committer_email:
			overrides.committer_email ?? overrides.author_email ?? "test@example.com",
		committed_date:
			overrides.committed_date ?? overrides.authored_date ?? commitDateISO,
		web_url:
			overrides.web_url ?? `https://gitlab.com/test/project/-/commit/${id}`,
		parent_ids: overrides.parent_ids ?? [],
		created_at: overrides.created_at ?? commitDateISO,
		stats: overrides.stats,
	};
}

/**
 * 複数のGitLabCommitオブジェクトのモックを生成
 * @param count - 生成するコミット数
 * @param overrides - 全コミットに適用するオーバーライド
 * @returns GitLabCommitオブジェクトの配列
 */
export function buildGitLabCommits(
	count: number,
	overrides: Partial<GitLabCommit> = {},
): GitLabCommit[] {
	return Array.from({ length: count }, () => buildGitLabCommit(overrides));
}
