/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 */

import { loadConfig } from "./config/index";

async function main(): Promise<void> {
	try {
		console.log("GitLabリポジトリ分析ツール");
		console.log(`Node.js環境: ${process.version}`);
		console.log();

		// 設定を読み込み
		console.log("設定を読み込み中...");
		const config = await loadConfig();

		// 設定内容を表示（TOKENは一部マスク）
		console.log("設定読み込み完了:");
		console.log("GitLab設定:", {
			...config.gitlab,
			token: config.gitlab.token
				? `${config.gitlab.token.slice(0, 10)}...`
				: "未設定",
		});
		console.log("データベース設定:", {
			...config.database,
			password: config.database.password ? "***" : "未設定",
		});

		// 分析機能はまだ実装されていないことを表示
		console.log();
		console.log("分析機能は今後のフェーズで実装予定です。");
	} catch (error) {
		console.error(
			"エラーが発生しました:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("予期しないエラー:", error);
		process.exit(1);
	});
}
