import { describe, expect, it } from "vitest";
import { mergeRequestsRepository } from "@/database/repositories";
import type { NewMergeRequest } from "@/database/schema/merge-requests";
import {
	buildNewMergeRequest,
	createMergeRequest,
	createProject,
} from "@/lib/testing/factories";
import { withTransaction } from "@/lib/testing/transaction";

describe("MergeRequests Repository", () => {
	describe("findByProject", () => {
		it("should find merge requests by project ID", async () => {
			await withTransaction(async () => {
				// テストプロジェクトを作成
				const project = await createProject();

				// テストマージリクエストを作成
				const mergeRequest1 = await createMergeRequest({
					project_id: project.id,
					title: "First MR",
				});
				const mergeRequest2 = await createMergeRequest({
					project_id: project.id,
					title: "Second MR",
				});

				// 別プロジェクトのマージリクエストも作成（フィルタ確認用）
				const otherProject = await createProject();
				await createMergeRequest({
					project_id: otherProject.id,
					title: "Other MR",
				});

				const found = await mergeRequestsRepository.findByProject(project.id);

				expect(found).toBeDefined();
				expect(Array.isArray(found)).toBe(true);
				expect(found.length).toBe(2);
				expect(found.some((mr) => mr.id === mergeRequest1.id)).toBe(true);
				expect(found.some((mr) => mr.id === mergeRequest2.id)).toBe(true);
				// 他のプロジェクトのマージリクエストが含まれていないことを確認
				expect(found.every((mr) => mr.project_id === project.id)).toBe(true);
			});
		});

		it("should return empty array for project with no merge requests", async () => {
			await withTransaction(async () => {
				const project = await createProject();
				const found = await mergeRequestsRepository.findByProject(project.id);

				expect(Array.isArray(found)).toBe(true);
				expect(found.length).toBe(0);
			});
		});

		it("should return merge requests ordered by gitlab_created_at", async () => {
			await withTransaction(async () => {
				const project = await createProject();

				// 作成日時が異なるマージリクエストを作成
				const mr1 = await createMergeRequest({
					project_id: project.id,
					title: "Older MR",
					gitlab_created_at: new Date("2023-01-01T00:00:00Z"),
				});
				const mr2 = await createMergeRequest({
					project_id: project.id,
					title: "Newer MR",
					gitlab_created_at: new Date("2023-01-02T00:00:00Z"),
				});

				const found = await mergeRequestsRepository.findByProject(project.id);

				expect(found.length).toBe(2);
				// 古い順にソートされていることを確認
				expect(found[0].id).toBe(mr1.id);
				expect(found[1].id).toBe(mr2.id);
			});
		});
	});

	describe("upsert", () => {
		it("should create new merge request when it doesn't exist", async () => {
			await withTransaction(async () => {
				const project = await createProject();
				const testMergeRequest = buildNewMergeRequest({
					project_id: project.id,
				});

				const upserted = await mergeRequestsRepository.upsert(testMergeRequest);

				expect(upserted).toBeDefined();
				expect(upserted.gitlab_id).toBe(testMergeRequest.gitlab_id);
				expect(upserted.title).toBe(testMergeRequest.title);
				expect(upserted.project_id).toBe(project.id);
			});
		});

		it("should update existing merge request when it exists", async () => {
			await withTransaction(async () => {
				const project = await createProject();
				// 既存のマージリクエストを作成
				const existingMr = await createMergeRequest({
					project_id: project.id,
					title: "Original title",
				});

				const updatedData: NewMergeRequest = buildNewMergeRequest({
					gitlab_id: existingMr.gitlab_id,
					project_id: project.id,
					title: "Updated title",
					description: "Updated description",
				});

				const upserted = await mergeRequestsRepository.upsert(updatedData);

				expect(upserted.id).toBe(existingMr.id);
				expect(upserted.title).toBe(updatedData.title);
				expect(upserted.description).toBe(updatedData.description);
				expect(upserted.gitlab_id).toBe(existingMr.gitlab_id);
			});
		});

		it("should throw error when GitLab ID is missing", async () => {
			await withTransaction(async () => {
				const project = await createProject();
				const validData = buildNewMergeRequest({ project_id: project.id });
				const invalidData = { ...validData };
				// biome-ignore lint/suspicious/noExplicitAny: テスト用途での型回避のため必要
				delete (invalidData as any).gitlab_id;

				await expect(
					mergeRequestsRepository.upsert(invalidData),
				).rejects.toThrow("GitLab IDが必要です");
			});
		});
	});

	describe("bulkUpsert", () => {
		it("should create multiple new merge requests", async () => {
			await withTransaction(async () => {
				const project = await createProject();
				const testMergeRequests = [
					buildNewMergeRequest({
						project_id: project.id,
						title: "MR 1",
					}),
					buildNewMergeRequest({
						project_id: project.id,
						title: "MR 2",
					}),
				];

				const upserted =
					await mergeRequestsRepository.bulkUpsert(testMergeRequests);

				expect(Array.isArray(upserted)).toBe(true);
				expect(upserted.length).toBe(2);
				expect(upserted[0].title).toBe("MR 1");
				expect(upserted[1].title).toBe("MR 2");
			});
		});

		it("should update existing merge requests and create new ones", async () => {
			await withTransaction(async () => {
				const project = await createProject();

				// 既存のマージリクエストを作成
				const existingMr = await createMergeRequest({
					project_id: project.id,
					title: "Existing MR",
				});

				const testMergeRequests = [
					// 既存のマージリクエストを更新
					buildNewMergeRequest({
						gitlab_id: existingMr.gitlab_id,
						project_id: project.id,
						title: "Updated existing MR",
					}),
					// 新しいマージリクエストを作成
					buildNewMergeRequest({
						project_id: project.id,
						title: "New MR",
					}),
				];

				const upserted =
					await mergeRequestsRepository.bulkUpsert(testMergeRequests);

				expect(upserted.length).toBe(2);

				// 既存のマージリクエストが更新されていることを確認
				const updatedExisting = upserted.find(
					(mr) => mr.gitlab_id === existingMr.gitlab_id,
				);
				expect(updatedExisting).toBeDefined();
				expect(updatedExisting?.id).toBe(existingMr.id);
				expect(updatedExisting?.title).toBe("Updated existing MR");

				// 新しいマージリクエストが作成されていることを確認
				const newMr = upserted.find((mr) => mr.title === "New MR");
				expect(newMr).toBeDefined();
				expect(newMr?.id).not.toBe(existingMr.id);
			});
		});

		it("should handle empty array", async () => {
			await withTransaction(async () => {
				const upserted = await mergeRequestsRepository.bulkUpsert([]);

				expect(Array.isArray(upserted)).toBe(true);
				expect(upserted.length).toBe(0);
			});
		});
	});
});
