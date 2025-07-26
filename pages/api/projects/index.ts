import type { NextApiRequest, NextApiResponse } from "next";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
} from "../../../src/api/utils/response.js";
import { projectsRepository } from "../../../src/database/index.js";
import type {
	ApiErrorResponse,
	ProjectListResponse,
} from "../../../src/types/api.js";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ProjectListResponse | ApiErrorResponse>,
) {
	// Only allow GET requests
	if (req.method !== "GET") {
		res.setHeader("Allow", ["GET"]);
		res.status(405).json(createErrorResponse("Method not allowed"));
		return;
	}

	try {
		// 全プロジェクトを取得（ページネーション・検索なし）
		const projects = await projectsRepository.findAll();

		// 成功レスポンスを返す
		res.status(200).json(createSuccessResponse(projects));
	} catch (error) {
		console.error("Failed to fetch projects:", error);

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
