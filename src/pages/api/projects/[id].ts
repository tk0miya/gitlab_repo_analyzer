import type { NextApiRequest, NextApiResponse } from "next";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
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
	const parseResult = IdStringSchema.safeParse(id);
	if (!parseResult.success) {
		res
			.status(400)
			.json(
				createErrorResponse(
					"IDが無効です",
					parseResult.error.errors.map((err) => err.message).join(", "),
				),
			);
		return;
	}

	const projectId = parseResult.data;

	// プロジェクトを取得
	const project = await projectsRepository.findById(projectId);
	if (!project) {
		res.status(404).json(createErrorResponse("プロジェクトが見つかりません"));
		return;
	}

	// データベース型からAPI型への変換
	const projectDetail = {
		id: project.id,
		gitlab_id: project.gitlab_id,
		name: project.name,
		description: project.description,
		web_url: project.web_url,
		default_branch: project.default_branch,
		visibility: project.visibility as "public" | "internal" | "private",
		created_at: project.created_at,
		gitlab_created_at: project.gitlab_created_at,
	};

	res.status(200).json(createSuccessResponse(projectDetail));
}

/**
 * プロジェクト削除ハンドラー
 */
async function deleteHandler(
	req: NextApiRequest,
	res: NextApiResponse<ApiErrorResponse>,
) {
	const { id } = req.query;

	// IDバリデーション
	const parseResult = IdStringSchema.safeParse(id);
	if (!parseResult.success) {
		res
			.status(400)
			.json(
				createErrorResponse(
					"IDが無効です",
					parseResult.error.errors.map((err) => err.message).join(", "),
				),
			);
		return;
	}

	const projectId = parseResult.data;

	// プロジェクトを削除（冪等性のため、存在しない場合も成功とする）
	await projectsRepository.delete(projectId);

	// 204 No Content を返す（冪等性を確保）
	res.status(204).end();
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
			case "DELETE":
				await deleteHandler(req, res);
				break;
			default:
				res.setHeader("Allow", ["GET", "DELETE"]);
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
