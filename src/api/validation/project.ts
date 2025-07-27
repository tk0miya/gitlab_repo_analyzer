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
		),

	// GitLab プロジェクトID（必須、正の整数）
	gitlab_project_id: z
		.number()
		.int()
		.positive("GitLab プロジェクトIDは正の整数である必要があります"),
});

/**
 * プロジェクト新規作成API用リクエストの型定義
 */
export type ProjectCreateApiRequest = z.infer<typeof ProjectCreateApiSchema>;
