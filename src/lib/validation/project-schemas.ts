import { z } from "zod";

/**
 * プロジェクト登録用バリデーションスキーマ
 * クライアントサイドとサーバーサイドで共通使用
 */
export const projectRegistrationSchema = z.object({
	url: z
		.string()
		.min(1, "URLは必須です")
		.url("有効なURLを入力してください")
		.max(500, "URLは500文字以内で入力してください")
		.refine((url) => {
			try {
				const urlObj = new URL(url);
				const pathSegments = urlObj.pathname.split("/").filter(Boolean);

				// GitLabドメインかどうかチェック（gitlab.comまたは任意のgitlabサブドメイン/ホスト）
				const isGitLabDomain =
					urlObj.hostname === "gitlab.com" ||
					urlObj.hostname.includes("gitlab");

				// GitLabプロジェクトのパス形式: /group/project または /group/subgroup/project
				const hasValidPath = pathSegments.length >= 2;

				return isGitLabDomain && hasValidPath;
			} catch {
				return false;
			}
		}, "GitLabプロジェクトの有効なURLを入力してください"),
});

export type ProjectRegistrationData = z.infer<typeof projectRegistrationSchema>;
