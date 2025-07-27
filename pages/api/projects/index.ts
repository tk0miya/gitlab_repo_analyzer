import type { NextApiRequest, NextApiResponse } from "next";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
} from "@/api/utils/response";
import { projectsRepository } from "@/database/index";
import type { ApiErrorResponse, ProjectListResponse } from "@/types/api";

/**
 * プロジェクト一覧取得ハンドラー
 */
async function getHandler(
	_req: NextApiRequest,
	res: NextApiResponse<ProjectListResponse | ApiErrorResponse>,
) {
	const projects = await projectsRepository.findAll();
	res.status(200).json(createSuccessResponse(projects));
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ProjectListResponse | ApiErrorResponse>,
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
