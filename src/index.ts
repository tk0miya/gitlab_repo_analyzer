/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 */

import { closeDb, DatabaseConnection, initializeDb } from "./database/index.js";

async function main(): Promise<void> {
	console.log("🚀 GitLabリポジトリ分析ツール");
	console.log(`📦 TypeScript環境: 正常動作`);
	console.log(`🟢 Node.js環境: ${process.version}`);

	try {
		// データベース初期化
		console.log("🔗 データベース接続中...");
		await initializeDb();

		// データベースヘルスチェック
		const db = DatabaseConnection.getInstance();
		const health = await db.healthCheck();

		if (health.status === "ok") {
			console.log("✅ データベース接続正常");
		} else {
			console.error("❌ データベース接続エラー:", health.message);
			return;
		}

		// マイグレーション実行
		console.log("🔄 マイグレーション確認中...");
		await db.runMigrations();

		console.log("✨ アプリケーション初期化完了");
		console.log("\n📋 利用可能なコマンド:");
		console.log("  - npm run db:migrate  # マイグレーション実行");
		console.log("  - npm run db:rollback # マイグレーションロールバック");
		console.log("  - npm run db:seed     # シードデータ実行");
		console.log("  - npx tsx src/database/cli.ts health # ヘルスチェック");
		console.log(
			"  - npx tsx src/database/cli.ts status # データベース状態確認",
		);
	} catch (error) {
		console.error("❌ 初期化エラー:", error);
		process.exit(1);
	} finally {
		await closeDb();
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("❌ 予期しないエラー:", error);
		process.exit(1);
	});
}
