"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { GitLabApiClient } from "@/api/gitlab-client";
import { projectsRepository } from "@/database/index";
import type { Project } from "@/database/schema/projects";
import { projectRegistrationSchema } from "@/lib/validation/project-schemas";

/**
 * プロジェクト一覧を取得するServer Action
 * @returns プロジェクト配列
 */
export async function getProjects(): Promise<Project[]> {
	try {
		return await projectsRepository.findAll();
	} catch (error) {
		console.error("プロジェクト一覧の取得に失敗しました:", error);
		throw new Error("プロジェクト一覧の取得に失敗しました");
	}
}

/**
 * プロジェクト登録のServer Action結果型
 */
export type ProjectRegistrationResult = {
	success: boolean;
	error?: string;
	project?: {
		id: number;
		name: string;
		gitlab_id: number;
		web_url: string;
	};
};

/**
 * URLからプロジェクトスラッグを抽出
 */
function extractProjectSlug(url: string): string {
	const urlObj = new URL(url);
	const pathSegments = urlObj.pathname.split("/").filter(Boolean);

	if (pathSegments.length < 2) {
		throw new Error("有効なプロジェクトパスではありません");
	}

	// 最後の2つのセグメントをgroup/projectとして取得
	return pathSegments.slice(-2).join("/");
}

/**
 * プロジェクト登録Server Action
 */
export async function registerProject(
	_prevState: ProjectRegistrationResult | null,
	formData: FormData,
): Promise<ProjectRegistrationResult> {
	try {
		// フォームデータの取得とバリデーション
		const url = formData.get("url");
		const validatedData = projectRegistrationSchema.parse({ url });
		const projectSlug = extractProjectSlug(validatedData.url);

		// GitLab APIクライアントの作成
		const gitlabClient = new GitLabApiClient();

		// GitLab APIからプロジェクト情報を取得
		const gitlabProject = await gitlabClient.getProject(projectSlug);

		// 既存プロジェクトのチェック
		const existingProject = await projectsRepository.findByGitlabId(
			gitlabProject.id,
		);

		if (existingProject) {
			return {
				success: false,
				error: "このプロジェクトは既に登録されています",
			};
		}

		// データベースにプロジェクトを作成
		await projectsRepository.create({
			gitlab_id: gitlabProject.id,
			name: gitlabProject.name,
			description: gitlabProject.description || null,
			web_url: validatedData.url,
			default_branch: gitlabProject.default_branch || "main",
			visibility: (gitlabProject.visibility || "private") as
				| "public"
				| "internal"
				| "private",
			gitlab_created_at: new Date(gitlabProject.created_at || Date.now()),
		});

		// 成功時は一覧ページにリダイレクト
		redirect("/projects");
	} catch (error) {
		console.error("プロジェクト登録エラー:", error);

		// Zodバリデーションエラー
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.errors[0]?.message || "入力データが無効です",
			};
		}

		// リダイレクトエラーは再スロー
		if (error instanceof Error && error.message === "NEXT_REDIRECT") {
			throw error;
		}

		// その他のエラー
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "プロジェクトの登録に失敗しました",
		};
	}
}
