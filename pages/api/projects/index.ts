import type { NextApiRequest, NextApiResponse } from "next";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
} from "../../../src/api/utils/response.js";
import { projectsRepository } from "../../../src/database/index.js";
import type { NewProject } from "../../../src/database/schema/projects.js";
import type {
	ApiErrorResponse,
	ProjectCreateResponse,
	ProjectListResponse,
} from "../../../src/types/api.js";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		ProjectListResponse | ProjectCreateResponse | ApiErrorResponse
	>,
) {
	// Allow GET and POST methods
	if (req.method !== "GET" && req.method !== "POST") {
		res.setHeader("Allow", ["GET", "POST"]);
		res.status(405).json(createErrorResponse("Method not allowed"));
		return;
	}

	try {
		if (req.method === "GET") {
			// プロジェクト一覧取得
			const projects = await projectsRepository.findAll();
			res.status(200).json(createSuccessResponse(projects));
		} else if (req.method === "POST") {
			// プロジェクト作成
			const projectData: NewProject = req.body;

			// 基本的なバリデーション
			if (
				!projectData.gitlab_id ||
				!projectData.name ||
				!projectData.web_url ||
				!projectData.default_branch ||
				!projectData.visibility ||
				!projectData.gitlab_created_at
			) {
				res
					.status(400)
					.json(createErrorResponse("必須フィールドが不足しています"));
				return;
			}

			// 重複チェック
			const existingProject = await projectsRepository.findByGitlabId(
				projectData.gitlab_id,
			);
			if (existingProject) {
				res
					.status(409)
					.json(
						createErrorResponse("同じGitLab IDのプロジェクトが既に存在します"),
					);
				return;
			}

			// プロジェクト作成
			const newProject = await projectsRepository.create(projectData);
			res.status(201).json(createSuccessResponse(newProject));
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
