import { z } from "zod";

/**
 * プロジェクト作成用バリデーションスキーマ
 */
export const ProjectCreateSchema = z.object({
	// GitLab プロジェクトID（必須、正の整数）
	gitlab_id: z
		.number()
		.int()
		.positive("GitLab IDは正の整数である必要があります"),

	// プロジェクト名（必須、1-255文字）
	name: z
		.string()
		.min(1, "プロジェクト名は必須です")
		.max(255, "プロジェクト名は255文字以内である必要があります")
		.trim(),

	// プロジェクト説明（任意）
	description: z
		.string()
		.max(10000, "説明は10000文字以内である必要があります")
		.optional()
		.nullable(),

	// プロジェクトのWebURL（必須、有効なURL、500文字以内）
	web_url: z
		.string()
		.url("有効なURLである必要があります")
		.max(500, "Web URLは500文字以内である必要があります"),

	// デフォルトブランチ（必須、1-255文字）
	default_branch: z
		.string()
		.min(1, "デフォルトブランチは必須です")
		.max(255, "デフォルトブランチは255文字以内である必要があります")
		.trim(),

	// 可視性設定（必須、指定された値のみ）
	visibility: z.enum(["public", "internal", "private"], {
		errorMap: () => ({
			message:
				"可視性はpublic、internal、privateのいずれかである必要があります",
		}),
	}),

	// GitLab上での作成日時（必須、ISO 8601形式の日時文字列）
	gitlab_created_at: z
		.string()
		.datetime("GitLab作成日時は有効なISO 8601形式である必要があります")
		.transform((str) => new Date(str)),
});

/**
 * プロジェクト更新用バリデーションスキーマ
 */
export const ProjectUpdateSchema = z.object({
	// プロジェクト名（任意、1-255文字）
	name: z
		.string()
		.min(1, "プロジェクト名は空にできません")
		.max(255, "プロジェクト名は255文字以内である必要があります")
		.trim()
		.optional(),

	// プロジェクト説明（任意）
	description: z
		.string()
		.max(10000, "説明は10000文字以内である必要があります")
		.optional()
		.nullable(),

	// プロジェクトのWebURL（任意、有効なURL、500文字以内）
	web_url: z
		.string()
		.url("有効なURLである必要があります")
		.max(500, "Web URLは500文字以内である必要があります")
		.optional(),

	// デフォルトブランチ（任意、1-255文字）
	default_branch: z
		.string()
		.min(1, "デフォルトブランチは空にできません")
		.max(255, "デフォルトブランチは255文字以内である必要があります")
		.trim()
		.optional(),

	// 可視性設定（任意、指定された値のみ）
	visibility: z
		.enum(["public", "internal", "private"], {
			errorMap: () => ({
				message:
					"可視性はpublic、internal、privateのいずれかである必要があります",
			}),
		})
		.optional(),

	// GitLab上での作成日時（任意、ISO 8601形式の日時文字列）
	gitlab_created_at: z
		.string()
		.datetime("GitLab作成日時は有効なISO 8601形式である必要があります")
		.transform((str) => new Date(str))
		.optional(),
});

/**
 * プロジェクト作成用リクエストの型定義
 */
export type ProjectCreateRequest = z.infer<typeof ProjectCreateSchema>;

/**
 * プロジェクト更新用リクエストの型定義
 */
export type ProjectUpdateRequest = z.infer<typeof ProjectUpdateSchema>;

/**
 * プロジェクト新規作成API用バリデーションスキーマ
 * POST /api/projects 用の簡略化されたリクエスト形式
 */
export const ProjectCreateApiSchema = z.object({
	// GitLab URL（必須、有効なURL、500文字以内）
	url: z
		.string()
		.url("有効なURLである必要があります")
		.max(500, "URLは500文字以内である必要があります")
		.refine(
			(url) => {
				try {
					const parsed = new URL(url);
					return parsed.hostname.length > 0;
				} catch {
					return false;
				}
			},
			{
				message: "有効なGitLab URLである必要があります",
			},
		)
		.refine(
			(url) => {
				try {
					// GitLab URL からプロジェクトスラッグを抽出できることを確認
					const parsed = new URL(url);
					const pathParts = parsed.pathname
						.split("/")
						.filter((part) => part.length > 0);
					return pathParts.length >= 2; // 最低限 group/project の形式
				} catch {
					return false;
				}
			},
			{
				message:
					"GitLab プロジェクトの有効なURLである必要があります（例: https://gitlab.com/group/project）",
			},
		),
});

/**
 * プロジェクト新規作成API用リクエストの型定義
 */
export type ProjectCreateApiRequest = z.infer<typeof ProjectCreateApiSchema>;

/**
 * データベースプロジェクト結果の型安全変換用スキーマ
 * Drizzle ORMの結果をAPI型に変換する際に使用
 */
export const DatabaseProjectSchema = z.object({
	id: z.number(),
	gitlab_id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	web_url: z.string(),
	default_branch: z.string(),
	visibility: z.enum(["public", "internal", "private"], {
		errorMap: () => ({
			message:
				"可視性はpublic、internal、privateのいずれかである必要があります",
		}),
	}),
	created_at: z.date(),
	gitlab_created_at: z.date(),
});

/**
 * 型安全なAPI用プロジェクト型
 */
export type SafeApiProject = z.infer<typeof DatabaseProjectSchema>;

/**
 * GitLab URL からプロジェクトスラッグ（path_with_namespace）を抽出
 * @param url GitLab プロジェクトのURL
 * @returns プロジェクトスラッグ（例: "group/project"）
 * @throws Error 無効なURLの場合
 */
export function extractProjectSlugFromUrl(url: string): string {
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
