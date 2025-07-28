import type { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import { GitLabApiClient } from "@/api/gitlab-client";
import type { GitLabProject } from "@/api/types/project";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
	formatZodErrors,
} from "@/api/utils/response";
import {
	DatabaseProjectSchema,
	type ProjectCreateApiRequest,
	ProjectCreateApiSchema,
} from "@/api/validation/project";
import { loadConfig } from "@/config";
import { projectsRepository } from "@/database/index";
import type { NewProject } from "@/database/schema/projects";
import type {
	ApiErrorResponse,
	ProjectCreateResponse,
	ProjectListResponse,
} from "@/types/api";

/**
 * GitLab URL からプロジェクトスラッグ（path_with_namespace）を抽出
 * @param url GitLab プロジェクトのURL
 * @returns プロジェクトスラッグ（例: "group/project"）
 * @throws Error 無効なURLの場合
 */
function extractProjectSlugFromUrl(url: string): string {
	try {
		const parsed = new URL(url);
		const pathParts = parsed.pathname
			.split("/")
			.filter((part) => part.length > 0);

		if (pathParts.length < 2) {
			throw new Error("URLからプロジェクトスラッグを抽出できません");
		}

		// group/project 形式のスラッグを抽出
		// 最初の2つのパス部分を結合（subgroup対応のため残りも含める可能性がある）
		return pathParts.join("/");
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("プロジェクトスラッグ")
		) {
			throw error;
		}
		throw new Error(`無効なURL形式です: ${url}`);
	}
}

/**
 * プロジェクト一覧取得ハンドラー
 */
async function getHandler(
	_req: NextApiRequest,
	res: NextApiResponse<ProjectListResponse | ApiErrorResponse>,
) {
	const dbProjects = await projectsRepository.findAll();

	// データベース型からAPI型への型安全変換
	const projects = dbProjects.map((project) =>
		DatabaseProjectSchema.parse(project),
	);

	res.status(200).json(createSuccessResponse(projects));
}

/**
 * プロジェクト新規作成ハンドラー
 */
async function postHandler(
	req: NextApiRequest,
	res: NextApiResponse<ProjectCreateResponse | ApiErrorResponse>,
) {
	try {
		// リクエストボディのバリデーション
		const projectRequest: ProjectCreateApiRequest =
			ProjectCreateApiSchema.parse(req.body);

		// 設定読み込み
		const config = await loadConfig();

		// GitLab API クライアント作成
		const gitlabClient = new GitLabApiClient({
			baseUrl: config.gitlab.url,
			token: config.gitlab.token,
			timeout: config.gitlab.timeout,
		});

		// URL からプロジェクトスラッグを抽出
		let projectSlug: string;
		try {
			projectSlug = extractProjectSlugFromUrl(projectRequest.url);
		} catch (error) {
			res
				.status(400)
				.json(
					createErrorResponse(
						"GitLab プロジェクトのURLが無効です",
						error instanceof Error ? error.message : "不明なエラー",
					),
				);
			return;
		}

		// GitLab APIからプロジェクト情報を取得
		let gitlabProject: GitLabProject;
		try {
			gitlabProject = await gitlabClient.getProject(projectSlug);
		} catch (error) {
			res
				.status(503)
				.json(
					createErrorResponse(
						"GitLab APIからプロジェクト情報を取得できませんでした",
						error instanceof Error ? error.message : "不明なエラー",
					),
				);
			return;
		}

		// gitlab_id で重複チェック
		const existingProject = await projectsRepository.findByGitlabId(
			gitlabProject.id,
		);
		if (existingProject) {
			res
				.status(409)
				.json(
					createErrorResponse(
						"指定されたGitLab プロジェクトは既に登録済みです",
						`GitLab ID: ${gitlabProject.id}, 名前: ${gitlabProject.name}`,
					),
				);
			return;
		}
		// データベース用のプロジェクトデータを作成
		const newProjectData: NewProject = {
			gitlab_id: gitlabProject.id,
			name: gitlabProject.name,
			description: gitlabProject.description,
			web_url: gitlabProject.web_url,
			default_branch: gitlabProject.default_branch,
			visibility: gitlabProject.visibility,
			gitlab_created_at: new Date(gitlabProject.created_at),
		};

		// データベースに保存（新規作成）
		const savedProject = await projectsRepository.create(newProjectData);

		// API用レスポンス形式に型安全変換
		const responseProject = DatabaseProjectSchema.parse(savedProject);

		res.status(201).json(createSuccessResponse(responseProject));
	} catch (error) {
		// Zodバリデーションエラー
		if (error instanceof ZodError) {
			res
				.status(400)
				.json(
					createErrorResponse(
						ERROR_MESSAGES.VALIDATION_FAILED,
						undefined,
						formatZodErrors(error),
					),
				);
			return;
		}

		// その他のエラー
		throw error;
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		ProjectListResponse | ProjectCreateResponse | ApiErrorResponse
	>,
) {
	try {
		switch (req.method) {
			case "GET":
				await getHandler(req, res);
				break;
			case "POST":
				await postHandler(req, res);
				break;
			default:
				res.setHeader("Allow", ["GET", "POST"]);
				res.status(405).json(createErrorResponse("Method not allowed"));
				return;
		}
	} catch (error) {
		console.error("API error:", error);

		// エラーレスポンスを返す
		res
			.status(500)
			.json(
				createErrorResponse(
					ERROR_MESSAGES.INTERNAL_ERROR,
					process.env.NODE_ENV === "development" ? String(error) : undefined,
				),
			);
	}
}
