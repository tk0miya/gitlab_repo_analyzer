import type { NextApiRequest, NextApiResponse } from "next";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
	formatZodErrors,
} from "@/api/utils/response";
import { IdStringSchema } from "@/api/validation/common";
import { projectsRepository } from "@/database/index";
import type { ApiErrorResponse, ProjectDetailResponse } from "@/types/api";

/**
 * プロジェクト詳細取得ハンドラー
 */
async function getHandler(
	req: NextApiRequest,
	res: NextApiResponse<ProjectDetailResponse | ApiErrorResponse>,
) {
	const { id } = req.query;

	// IDバリデーション
	const validationResult = IdStringSchema.safeParse(id);
	if (!validationResult.success) {
		res
			.status(400)
			.json(
				createErrorResponse(
					ERROR_MESSAGES.VALIDATION_FAILED,
					undefined,
					formatZodErrors(validationResult.error),
				),
			);
		return;
	}

	const projectId = validationResult.data;

	// プロジェクト取得
	const dbProject = await projectsRepository.findById(projectId);

	if (!dbProject) {
		res.status(404).json(createErrorResponse(ERROR_MESSAGES.NOT_FOUND));
		return;
	}

	// データベース型からAPI型への変換
	const project = {
		id: dbProject.id,
		gitlab_id: dbProject.gitlab_id,
		name: dbProject.name,
		description: dbProject.description,
		web_url: dbProject.web_url,
		default_branch: dbProject.default_branch,
		visibility: dbProject.visibility as "public" | "internal" | "private",
		created_at: dbProject.created_at,
		gitlab_created_at: dbProject.gitlab_created_at,
	};

	res.status(200).json(createSuccessResponse(project));
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ProjectDetailResponse | ApiErrorResponse>,
) {
	try {
		switch (req.method) {
			case "GET":
				await getHandler(req, res);
				break;
			default:
				res.setHeader("Allow", ["GET"]);
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
