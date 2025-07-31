"use server";

import { ProjectsRepository } from "@/database/repositories/projects";
import type { Project } from "@/database/schema/projects";

/**
 * プロジェクト一覧を取得するServer Action
 * @returns プロジェクト配列
 */
export async function getProjects(): Promise<Project[]> {
	const projectsRepository = new ProjectsRepository();

	try {
		return await projectsRepository.findAll();
	} catch (error) {
		console.error("プロジェクト一覧の取得に失敗しました:", error);
		throw new Error("プロジェクト一覧の取得に失敗しました");
	}
}
