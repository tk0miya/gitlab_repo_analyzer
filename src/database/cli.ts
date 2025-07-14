#!/usr/bin/env node

/**
 * データベース管理CLI
 *
 * 使用方法:
 * npx tsx src/database/cli.ts migrate    # マイグレーション実行
 * npx tsx src/database/cli.ts rollback   # マイグレーションロールバック
 * npx tsx src/database/cli.ts seed       # シードデータ実行
 * npx tsx src/database/cli.ts status     # データベース状態確認
 * npx tsx src/database/cli.ts health     # ヘルスチェック
 */

import { DatabaseConnection } from "./connection.js";

async function main() {
	const command = process.argv[2];

	if (!command) {
		console.log(`
データベース管理CLI

使用方法:
  npx tsx src/database/cli.ts <command>

コマンド:
  migrate     マイグレーション実行
  rollback    マイグレーションロールバック  
  seed        シードデータ実行
  status      データベース状態確認
  health      ヘルスチェック
  reset       データベースリセット（ロールバック→マイグレーション）

環境変数:
  NODE_ENV    実行環境 (development|test|production, デフォルト: development)
  DB_HOST     データベースホスト (デフォルト: localhost)
  DB_PORT     データベースポート (デフォルト: 5432)
  DB_NAME     データベース名
  DB_USER     データベースユーザー (デフォルト: postgres)
  DB_PASSWORD データベースパスワード (デフォルト: postgres)
`);
		process.exit(1);
	}

	const db = DatabaseConnection.getInstance();

	try {
		console.log(`🔄 環境: ${process.env.NODE_ENV || "development"}`);
		console.log(`🔗 データベース接続中...`);

		await db.initialize();

		switch (command) {
			case "migrate":
				await db.runMigrations();
				break;

			case "rollback":
				await db.rollbackMigrations();
				break;

			case "seed":
				await db.runSeeds();
				break;

			case "status":
				await showStatus(db);
				break;

			case "health":
				await showHealth(db);
				break;

			case "reset":
				console.log("🔄 データベースリセット中...");
				await db.rollbackMigrations();
				await db.runMigrations();
				console.log("✅ データベースリセット完了");
				break;

			default:
				console.error(`❌ 不明なコマンド: ${command}`);
				process.exit(1);
		}
	} catch (error) {
		console.error("❌ コマンド実行エラー:", error);
		process.exit(1);
	} finally {
		await db.close();
	}
}

async function showStatus(db: DatabaseConnection) {
	const knex = db.getKnex();

	console.log("\n📊 データベース状態:");

	try {
		// マイグレーション状態確認
		const migrationStatus = await knex.migrate.currentVersion();
		console.log(`  現在のマイグレーション: ${migrationStatus}`);

		// テーブル一覧
		const tables = await knex.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

		console.log("\n📋 テーブル一覧:");
		for (const table of tables.rows) {
			const count = await knex(table.table_name).count("*").first();
			console.log(`  - ${table.table_name}: ${count?.count || 0} 件`);
		}

		// インデックス情報
		const indexes = await knex.raw(`
      SELECT 
        tablename,
        COUNT(*) as index_count
      FROM pg_indexes 
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY tablename
    `);

		console.log("\n🔍 インデックス情報:");
		for (const index of indexes.rows) {
			console.log(`  - ${index.tablename}: ${index.index_count} 個`);
		}
	} catch (error) {
		console.error("❌ 状態確認エラー:", error);
	}
}

async function showHealth(db: DatabaseConnection) {
	console.log("\n🏥 ヘルスチェック実行中...");

	const health = await db.healthCheck();

	if (health.status === "ok") {
		console.log(`✅ ${health.message}`);
		console.log(`🕐 チェック時刻: ${health.timestamp.toISOString()}`);
	} else {
		console.log(`❌ ${health.message}`);
		console.log(`🕐 チェック時刻: ${health.timestamp.toISOString()}`);
	}

	// 追加のヘルスチェック
	try {
		const knex = db.getKnex();

		// 接続プール状態
		const pool = knex.client.pool;
		console.log(`\n📊 接続プール状態:`);
		console.log(`  - 最小接続数: ${pool.min}`);
		console.log(`  - 最大接続数: ${pool.max}`);
		console.log(`  - アクティブ接続数: ${pool.numUsed()}`);
		console.log(`  - 待機中接続数: ${pool.numFree()}`);
		console.log(`  - 保留中リクエスト数: ${pool.numPendingAcquires()}`);

		// シンプルなクエリテスト
		const result = await knex.raw("SELECT NOW() as current_time");
		console.log(`\n⏰ データベース時刻: ${result.rows[0].current_time}`);
	} catch (error) {
		console.error("❌ 詳細ヘルスチェックエラー:", error);
	}
}

// メイン関数実行
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("❌ 予期しないエラー:", error);
		process.exit(1);
	});
}
