/**
 * GitLab APIのマージリクエストデータのモック生成ヘルパー
 */

import type { GitLabMergeRequest } from "@/lib/gitlab_client/types/merge-request";

let gitlabMergeRequestIdCounter = 1;
// 基準日時: 2025/1/1 00:00:00 UTC
const baseDate = new Date("2025-01-01T00:00:00Z");

/**
 * GitLabMergeRequestオブジェクトのモックを生成
 * @param overrides - オーバーライドしたいフィールド
 * @returns GitLabMergeRequestオブジェクト
 */
export function buildGitLabMergeRequest(
	overrides: Partial<GitLabMergeRequest> = {},
): GitLabMergeRequest {
	const uniqueId = gitlabMergeRequestIdCounter++;
	const iid = overrides.iid ?? uniqueId;
	// 基準日時から1分ずつずらした時間を生成
	const mrDate = new Date(baseDate.getTime() + (uniqueId - 1) * 60000);
	const mrDateISO = mrDate.toISOString();

	return {
		id: overrides.id ?? uniqueId,
		iid,
		title: overrides.title ?? `マージリクエスト ${uniqueId}`,
		description:
			overrides.description ??
			`マージリクエスト ${uniqueId}の説明\n\nThis is a test merge request.`,
		state: overrides.state ?? "opened",
		created_at: overrides.created_at ?? mrDateISO,
		updated_at: overrides.updated_at ?? mrDateISO,
		merged_at: overrides.merged_at ?? null,
		merged_by: overrides.merged_by ?? null,
		closed_at: overrides.closed_at ?? null,
		target_branch: overrides.target_branch ?? "main",
		source_branch: overrides.source_branch ?? `feature/mr-${uniqueId}`,
		user_notes_count: overrides.user_notes_count ?? 0,
		author: overrides.author ?? {
			id: 1,
			username: "testuser",
			name: "Test User",
			state: "active",
			avatar_url: null,
			web_url: "https://gitlab.com/testuser",
		},
		assignees: overrides.assignees ?? [],
		assignee: overrides.assignee ?? null,
		reviewers: overrides.reviewers ?? [],
		source_project_id: overrides.source_project_id ?? 123,
		target_project_id: overrides.target_project_id ?? 123,
		web_url:
			overrides.web_url ??
			`https://gitlab.com/test/project/-/merge_requests/${iid}`,
		draft: overrides.draft ?? false,
		work_in_progress: overrides.work_in_progress ?? false,
		milestone: overrides.milestone ?? null,
		merge_when_pipeline_succeeds:
			overrides.merge_when_pipeline_succeeds ?? false,
		merge_status: overrides.merge_status ?? "can_be_merged",
		merge_error: overrides.merge_error ?? null,
		sha: overrides.sha ?? `abc${uniqueId.toString().padStart(37, "0")}`,
		merge_commit_sha: overrides.merge_commit_sha ?? null,
		squash_commit_sha: overrides.squash_commit_sha ?? null,
		discussion_locked: overrides.discussion_locked ?? false,
		should_remove_source_branch: overrides.should_remove_source_branch ?? false,
		force_remove_source_branch: overrides.force_remove_source_branch ?? false,
		allow_collaboration: overrides.allow_collaboration ?? false,
		allow_maintainer_to_push: overrides.allow_maintainer_to_push ?? false,
		squash: overrides.squash ?? false,
		time_stats: overrides.time_stats ?? {
			time_estimate: 0,
			total_time_spent: 0,
			human_time_estimate: null,
			human_total_time_spent: null,
		},
		pipeline: overrides.pipeline ?? null,
		head_pipeline: overrides.head_pipeline ?? null,
		diff_refs: overrides.diff_refs ?? {
			base_sha: "base123",
			head_sha: "head123",
			start_sha: "start123",
		},
		merge_params: overrides.merge_params ?? null,
		subscribed: overrides.subscribed ?? false,
		changes_count: overrides.changes_count ?? "0",
		latest_build_started_at: overrides.latest_build_started_at ?? null,
		latest_build_finished_at: overrides.latest_build_finished_at ?? null,
		first_deployed_to_production_at:
			overrides.first_deployed_to_production_at ?? null,
		has_conflicts: overrides.has_conflicts ?? false,
		blocking_discussions_resolved:
			overrides.blocking_discussions_resolved ?? true,
		approvals_before_merge: overrides.approvals_before_merge ?? 0,
	};
}

/**
 * マージ済み状態のGitLabMergeRequestオブジェクトのモックを生成
 * @param overrides - オーバーライドしたいフィールド
 * @returns マージ済み状態のGitLabMergeRequestオブジェクト
 */
export function buildMergedGitLabMergeRequest(
	overrides: Partial<GitLabMergeRequest> = {},
): GitLabMergeRequest {
	const uniqueId = gitlabMergeRequestIdCounter++;
	// 基準日時から1分ずつずらした時間を生成
	const mergedDate = new Date(baseDate.getTime() + (uniqueId - 1) * 60000);
	const mergedDateISO = mergedDate.toISOString();

	return buildGitLabMergeRequest({
		state: "merged",
		merged_at: mergedDateISO,
		merged_by: {
			id: 42,
			username: "merger",
			name: "Merge User",
			state: "active",
			avatar_url:
				"https://gitlab.com/uploads/-/system/user/avatar/42/avatar.png",
			web_url: "https://gitlab.com/merger",
		},
		merge_commit_sha: `merge${uniqueId.toString().padStart(35, "0")}`,
		...overrides,
	});
}

/**
 * 複数のGitLabMergeRequestオブジェクトのモックを生成
 * @param count - 生成するマージリクエスト数
 * @param overrides - 全マージリクエストに適用するオーバーライド
 * @returns GitLabMergeRequestオブジェクトの配列
 */
export function buildGitLabMergeRequests(
	count: number,
	overrides: Partial<GitLabMergeRequest> = {},
): GitLabMergeRequest[] {
	return Array.from({ length: count }, () =>
		buildGitLabMergeRequest(overrides),
	);
}
