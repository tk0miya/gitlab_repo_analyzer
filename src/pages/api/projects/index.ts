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
	extractProjectSlugFromUrl,
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
 * プロジェクト一覧取得ハンドラー
 */
async function getHandler(
	_req: NextApiRequest,
	res: NextApiResponse<ProjectListResponse | ApiErrorResponse>,
) {
	const dbProjects = await projectsRepository.findAll();

	// データベース型からAPI型への変換
	const projects = dbProjects.map((project) => ({
		id: project.id,
		gitlab_id: project.gitlab_id,
		name: project.name,
		description: project.description,
		web_url: project.web_url,
		default_branch: project.default_branch,
		visibility: project.visibility as "public" | "internal" | "private",
		created_at: project.created_at,
		gitlab_created_at: project.gitlab_created_at,
	}));

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

		// URL で重複チェック
		const existingProject = await projectsRepository.findByUrl(
			projectRequest.url,
		);
		if (existingProject) {
			res
				.status(409)
				.json(
					createErrorResponse(
						"指定されたGitLab プロジェクトURLは既に登録済みです",
						`URL: ${projectRequest.url}`,
					),
				);
			return;
		}

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

		// API用レスポンス形式に変換
		const responseProject = {
			id: savedProject.id,
			gitlab_id: savedProject.gitlab_id,
			name: savedProject.name,
			description: savedProject.description,
			web_url: savedProject.web_url,
			default_branch: savedProject.default_branch,
			visibility: savedProject.visibility as "public" | "internal" | "private",
			created_at: savedProject.created_at,
			gitlab_created_at: savedProject.gitlab_created_at,
		};

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
