import knex, { type Knex } from "knex";
import config from "./knexfile.js";

/**
 * データベース接続管理クラス
 */
export class DatabaseConnection {
	private static instance: DatabaseConnection;
	private knexInstance: Knex | null = null;
	private environment: string;

	private constructor() {
		this.environment = process.env.NODE_ENV || "development";
	}

	/**
	 * シングルトンインスタンスを取得
	 */
	public static getInstance(): DatabaseConnection {
		if (!DatabaseConnection.instance) {
			DatabaseConnection.instance = new DatabaseConnection();
		}
		return DatabaseConnection.instance;
	}

	/**
	 * データベース接続を初期化
	 */
	public async initialize(): Promise<void> {
		if (this.knexInstance) {
			return; // 既に初期化済み
		}

		const envConfig = config[this.environment];
		if (!envConfig) {
			throw new Error(`Invalid environment: ${this.environment}`);
		}

		this.knexInstance = knex(envConfig);

		// 接続テスト
		try {
			await this.knexInstance.raw("SELECT 1");
			console.log(`✅ データベース接続成功 (環境: ${this.environment})`);
		} catch (error) {
			console.error("❌ データベース接続失敗:", error);
			throw error;
		}
	}

	/**
	 * Knexインスタンスを取得
	 */
	public getKnex(): Knex {
		if (!this.knexInstance) {
			throw new Error(
				"データベース接続が初期化されていません。initialize()を呼び出してください。",
			);
		}
		return this.knexInstance;
	}

	/**
	 * データベース接続を閉じる
	 */
	public async close(): Promise<void> {
		if (this.knexInstance) {
			await this.knexInstance.destroy();
			this.knexInstance = null;
			console.log("📕 データベース接続を閉じました");
		}
	}

	/**
	 * マイグレーションを実行
	 */
	public async runMigrations(): Promise<void> {
		const knex = this.getKnex();

		console.log("🔄 マイグレーション実行中...");

		try {
			const [batch, migrationFiles] = await knex.migrate.latest();

			if (migrationFiles.length === 0) {
				console.log("✅ 実行するマイグレーションはありません（最新状態です）");
			} else {
				console.log(`✅ マイグレーション完了 (バッチ: ${batch})`);
				console.log("適用されたマイグレーション:");
				migrationFiles.forEach((file: string) => console.log(`  - ${file}`));
			}
		} catch (error) {
			console.error("❌ マイグレーション実行失敗:", error);
			throw error;
		}
	}

	/**
	 * マイグレーションをロールバック
	 */
	public async rollbackMigrations(): Promise<void> {
		const knex = this.getKnex();

		console.log("🔄 マイグレーションロールバック中...");

		try {
			const [batch, migrationFiles] = await knex.migrate.rollback();

			if (migrationFiles.length === 0) {
				console.log("✅ ロールバックするマイグレーションはありません");
			} else {
				console.log(`✅ マイグレーションロールバック完了 (バッチ: ${batch})`);
				console.log("ロールバックされたマイグレーション:");
				migrationFiles.forEach((file: string) => console.log(`  - ${file}`));
			}
		} catch (error) {
			console.error("❌ マイグレーションロールバック失敗:", error);
			throw error;
		}
	}

	/**
	 * シードデータを実行
	 */
	public async runSeeds(): Promise<void> {
		const knex = this.getKnex();

		console.log("🔄 シードデータ実行中...");

		try {
			const seedFiles = await knex.seed.run();

			if (!seedFiles[0] || seedFiles[0].length === 0) {
				console.log("✅ 実行するシードファイルはありません");
			} else {
				console.log("✅ シードデータ実行完了");
				console.log("実行されたシードファイル:");
				seedFiles[0].forEach((file: string) => console.log(`  - ${file}`));
			}
		} catch (error) {
			console.error("❌ シードデータ実行失敗:", error);
			throw error;
		}
	}

	/**
	 * ヘルスチェック
	 */
	public async healthCheck(): Promise<{
		status: "ok" | "error";
		message: string;
		timestamp: Date;
	}> {
		try {
			const knex = this.getKnex();
			await knex.raw("SELECT 1");

			return {
				status: "ok",
				message: "データベース接続正常",
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				status: "error",
				message: `データベース接続エラー: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: new Date(),
			};
		}
	}
}

// 便利な関数エクスポート
export const getDb = (): Knex => DatabaseConnection.getInstance().getKnex();
export const initializeDb = (): Promise<void> =>
	DatabaseConnection.getInstance().initialize();
export const closeDb = (): Promise<void> =>
	DatabaseConnection.getInstance().close();
