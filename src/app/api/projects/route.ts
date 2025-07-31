import { NextResponse } from "next/server";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_MESSAGES,
} from "@/api/utils/response";
import { projectsRepository } from "@/database/index";

/**
 * プロジェクト一覧取得ハンドラー
 */
export async function GET() {
	try {
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

		return NextResponse.json(createSuccessResponse(projects));
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
