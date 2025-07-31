import type { NewCommit } from "@/database/schema/commits";

/**
 * コミットテストデータファクトリ
 *
 * このファクトリ関数群は、テスト間でコミットデータを一貫して生成するために使用します。
 * デフォルトの値を提供し、必要に応じて特定のフィールドをオーバーライドできます。
 */

let shaCounter = 1; // テスト用のSHA生成用カウンタ

/**
 * 基本的なコミットデータを生成します
 * @param overrides - オーバーライドしたいフィールド
 * @returns NewCommit オブジェクト
 */
export function createCommitData(
	overrides: Partial<NewCommit> = {},
): NewCommit {
	const uniqueId = shaCounter++;
	const sha = overrides.sha ?? `abcdef${uniqueId.toString().padStart(34, "0")}`;

	return {
		project_id: 1, // デフォルトプロジェクトID
		sha,
		message: `テストコミット ${uniqueId}`,
		author_name: "テストユーザー",
		author_email: "test@example.com",
		author_date: new Date("2023-01-01T10:00:00Z"),
		additions: 10,
		deletions: 5,
		...overrides,
	};
}

/**
 * 複数のコミットデータを生成します
 * @param count - 生成するコミット数
 * @param baseOverrides - 全コミットに適用するベースオーバーライド
 * @returns NewCommit配列
 */
export function createMultipleCommitsData(
	count: number,
	baseOverrides: Partial<NewCommit> = {},
): NewCommit[] {
	return Array.from({ length: count }, (_, index) => {
		const uniqueId = shaCounter++;
		return createCommitData({
			...baseOverrides,
			sha: baseOverrides.sha
				? `${baseOverrides.sha}_${index + 1}`
				: `abcdef${uniqueId.toString().padStart(34, "0")}`,
			message: baseOverrides.message
				? `${baseOverrides.message} ${index + 1}`
				: `テストコミット ${uniqueId}`,
		});
	});
}
