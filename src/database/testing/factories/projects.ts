import type { NewProject } from "@/database/schema/projects";
import type { Project } from "@/types/api";

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
	return Array.from({ length: count }, (_, index) => {
		const overrides = { ...baseOverrides };
		// nameが指定されている場合のみインデックスを追加
		if (baseOverrides.name) {
			overrides.name = `${baseOverrides.name}-${index + 1}`;
		}
		return createProjectData(overrides);
	});
}

let registeredIdCounter = 1; // 登録済みプロジェクト用のIDカウンター

/**
 * 登録済みプロジェクトデータを生成します（API レスポンス用）
 * idとcreated_atを含む完全なProjectオブジェクトを生成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns Project オブジェクト
 */
export function createRegisteredProjectData(
	overrides: Partial<Project> = {},
): Project {
	const id = overrides.id ?? registeredIdCounter++;

	// NewProjectに含まれるフィールドのみを抽出してbaseProjectDataを作成
	const newProjectOverrides: Partial<NewProject> = {};
	if (overrides.gitlab_id !== undefined)
		newProjectOverrides.gitlab_id = overrides.gitlab_id;
	if (overrides.name !== undefined) newProjectOverrides.name = overrides.name;
	if (overrides.description !== undefined)
		newProjectOverrides.description = overrides.description;
	if (overrides.web_url !== undefined)
		newProjectOverrides.web_url = overrides.web_url;
	if (overrides.default_branch !== undefined)
		newProjectOverrides.default_branch = overrides.default_branch;
	if (overrides.visibility !== undefined)
		newProjectOverrides.visibility = overrides.visibility;
	if (overrides.gitlab_created_at !== undefined)
		newProjectOverrides.gitlab_created_at = overrides.gitlab_created_at;

	const baseProjectData = createProjectData(newProjectOverrides);

	const result = {
		id,
		created_at: overrides.created_at ?? new Date("2023-01-01T00:00:00Z"),
		...baseProjectData,
		...overrides,
	};

	// undefinedをnullに変換し、型制約を満たすようにAPI型との整合性を保つ
	return {
		...result,
		description: result.description ?? null,
		visibility: result.visibility as "public" | "internal" | "private",
	};
}

/**
 * 複数の登録済みプロジェクトデータを生成します（API レスポンス用）
 * @param count - 生成するプロジェクト数
 * @param baseOverrides - 全プロジェクトに適用するベースオーバーライド
 * @returns Project配列
 */
export function createMultipleRegisteredProjectsData(
	count: number,
	baseOverrides: Partial<Project> = {},
): Project[] {
	return Array.from({ length: count }, (_, index) => {
		const projectOverrides = { ...baseOverrides };
		if (baseOverrides.name) {
			projectOverrides.name = `${baseOverrides.name}-${index + 1}`;
		}
		return createRegisteredProjectData(projectOverrides);
	});
}
