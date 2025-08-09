import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";
import { projectRegistrationSchema } from "../project-schemas";

describe("projectRegistrationSchema", () => {
	describe("URL validation", () => {
		it("should require URL field", () => {
			const result = projectRegistrationSchema.safeParse({ url: "" });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("URLは必須です");
			}
		});

		it("should validate URL format", () => {
			const result = projectRegistrationSchema.safeParse({
				url: "invalid-url",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some(
						(e: ZodIssue) => e.message === "有効なURLを入力してください",
					),
				).toBe(true);
			}
		});

		it("should validate URL length", () => {
			const longUrl = `https://gitlab.com/${"a".repeat(500)}`;
			const result = projectRegistrationSchema.safeParse({ url: longUrl });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some(
						(e: ZodIssue) => e.message === "URLは500文字以内で入力してください",
					),
				).toBe(true);
			}
		});

		it("should validate GitLab project URL format", () => {
			const invalidUrls = [
				"https://gitlab.com/singlepath",
				"https://github.com/user/repo",
				"https://example.com/some/path",
			];

			for (const url of invalidUrls) {
				const result = projectRegistrationSchema.safeParse({ url });
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(
						result.error.issues.some(
							(e: ZodIssue) =>
								e.message === "GitLabプロジェクトの有効なURLを入力してください",
						),
					).toBe(true);
				}
			}
		});

		it("should accept valid GitLab project URLs", () => {
			const validUrls = [
				"https://gitlab.com/group/project",
				"https://gitlab.example.com/group/subgroup/project",
				"https://gitlab.com/user/my-project",
			];

			for (const url of validUrls) {
				const result = projectRegistrationSchema.safeParse({ url });
				expect(result.success).toBe(true);
			}
		});
	});
});
