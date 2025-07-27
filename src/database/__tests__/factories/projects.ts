import type { NewProject } from "@/database/schema/projects.js";

/**
 * プロジェクトテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間でプロジェクトデータを一貫して生成するために使用します。
 * デフォルトの値を提供し、必要に応じて特定のフィールドをオーバーライドできます。
 */

let gitlabIdCounter = 100000; // テスト用のGitLab ID開始値

/**
 * 基本的なプロジェクトデータを生成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewProject オブジェクト
 */
export function createProjectData(
	overrides: Partial<NewProject> = {},
): NewProject {
	const gitlabId = overrides.gitlab_id ?? gitlabIdCounter++;

	return {
		gitlab_id: gitlabId,
		name: `test-project-${gitlabId}`,
		description: `Test project description for ${gitlabId}`,
		web_url: `https://gitlab.example.com/test/test-project-${gitlabId}`,
		default_branch: "main",
		visibility: "public",
		gitlab_created_at: new Date("2023-01-01T00:00:00Z"),
		...overrides,
	};
}

/**
 * 複数のプロジェクトデータを生成します
 * @param count - 生成するプロジェクト数
 * @param baseOverrides - 全プロジェクトに適用するベースオーバーライド
 * @returns NewProject配列
 */
export function createMultipleProjectsData(
	count: number,
	baseOverrides: Partial<NewProject> = {},
): NewProject[] {
	return Array.from({ length: count }, (_, index) =>
		createProjectData({
			...baseOverrides,
			name: baseOverrides.name
				? `${baseOverrides.name}-${index + 1}`
				: undefined,
		}),
	);
}
