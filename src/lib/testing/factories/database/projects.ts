import { ProjectsRepository } from "@/database/repositories/projects";
import type { NewProject, Project } from "@/database/schema/projects";

/**
 * プロジェクトテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間でプロジェクトデータを一貫して生成するために使用します。
 * build系: インメモリオブジェクトの生成
 * create系: データベースへの永続化を含む操作
 */

let gitlabIdCounter = 100000; // テスト用のGitLab ID開始値
let projectIdCounter = 1; // 登録済みプロジェクト用のIDカウンター

/**
 * NewProjectオブジェクトを生成します（インメモリ）
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewProject オブジェクト
 */
export function buildNewProject(
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
 * Projectオブジェクトを生成します（インメモリ、idとcreated_atを含む）
 * @param overrides - オーバーライドしたいフィールド
 * @returns Project オブジェクト
 */
export function buildProject(overrides: Partial<Project> = {}): Project {
	const id = overrides.id ?? projectIdCounter++;

	// NewProjectに含まれるフィールドのみを抽出
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

	const baseProjectData = buildNewProject(newProjectOverrides);

	const result = {
		id,
		created_at: overrides.created_at ?? new Date("2023-01-01T00:00:00Z"),
		...baseProjectData,
		...overrides,
	};

	// undefinedをnullに変換し、型制約を満たす
	return {
		...result,
		description: result.description ?? null,
	};
}

/**
 * 複数のProjectオブジェクトを生成します（インメモリ）
 * @param count - 生成するプロジェクト数
 * @param overrides - 全プロジェクトに適用するオーバーライド
 * @returns Project配列
 */
export function buildProjects(
	count: number,
	overrides: Partial<Project> = {},
): Project[] {
	return Array.from({ length: count }, (_, index) => {
		const projectOverrides = { ...overrides };
		if (overrides.name) {
			projectOverrides.name = `${overrides.name}-${index + 1}`;
		}
		return buildProject(projectOverrides);
	});
}

/**
 * プロジェクトをデータベースに作成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns 作成されたProjectオブジェクト
 */
export async function createProject(
	overrides: Partial<NewProject> = {},
): Promise<Project> {
	const projectsRepository = new ProjectsRepository();
	const newProject = buildNewProject(overrides);
	return await projectsRepository.create(newProject);
}

/**
 * 複数のプロジェクトをデータベースに作成します
 * @param count - 作成するプロジェクト数
 * @param overrides - 全プロジェクトに適用するオーバーライド
 * @returns 作成されたProject配列
 */
export async function createProjects(
	count: number,
	overrides: Partial<NewProject> = {},
): Promise<Project[]> {
	const projects: Project[] = [];
	for (let i = 0; i < count; i++) {
		const projectOverrides = { ...overrides };
		if (overrides.name) {
			projectOverrides.name = `${overrides.name}-${i + 1}`;
		}
		const project = await createProject(projectOverrides);
		projects.push(project);
	}
	return projects;
}
