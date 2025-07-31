import { type NextRequest, NextResponse } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
} from "@/api/utils/response";
import { IdStringSchema } from "@/api/validation/common";
import { projectsRepository } from "@/database/index";

/**
 * プロジェクト詳細取得ハンドラー
 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { id } = params;

		// IDバリデーション
		const parseResult = IdStringSchema.safeParse(id);
		if (!parseResult.success) {
			return NextResponse.json(
				createErrorResponse(
					"IDが無効です",
					parseResult.error.errors.map((err) => err.message).join(", "),
				),
				{ status: 400 },
			);
		}

		const projectId = parseResult.data;

		// プロジェクトを取得
		const project = await projectsRepository.findById(projectId);
		if (!project) {
			return NextResponse.json(
				createErrorResponse("プロジェクトが見つかりません"),
				{ status: 404 },
			);
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

		return NextResponse.json(createSuccessResponse(projectDetail));
	} catch (error) {
		console.error("API error:", error);

		return NextResponse.json(
			createErrorResponse(
				ERROR_MESSAGES.INTERNAL_ERROR,
				process.env.NODE_ENV === "development" ? String(error) : undefined,
			),
			{ status: 500 },
		);
	}
}

/**
 * プロジェクト削除ハンドラー
 */
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { id } = params;

		// IDバリデーション
		const parseResult = IdStringSchema.safeParse(id);
		if (!parseResult.success) {
			return NextResponse.json(
				createErrorResponse(
					"IDが無効です",
					parseResult.error.errors.map((err) => err.message).join(", "),
				),
				{ status: 400 },
			);
		}

		const projectId = parseResult.data;

		// プロジェクトを削除（冪等性のため、存在しない場合も成功とする）
		await projectsRepository.delete(projectId);

		// 204 No Content を返す（冪等性を確保）
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error("API error:", error);

		return NextResponse.json(
			createErrorResponse(
				ERROR_MESSAGES.INTERNAL_ERROR,
				process.env.NODE_ENV === "development" ? String(error) : undefined,
			),
			{ status: 500 },
		);
	}
}
