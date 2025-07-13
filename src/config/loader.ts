import { config as loadEnv } from "dotenv";
import type { Config } from "./schema.js";
import { ConfigSchema } from "./schema.js";

/**
 * 設定ローダー - 環境変数から設定を読み込み
 */
export class ConfigLoader {
	private static instance: ConfigLoader;

	private constructor() {}

	public static getInstance(): ConfigLoader {
		if (!ConfigLoader.instance) {
			ConfigLoader.instance = new ConfigLoader();
		}
		return ConfigLoader.instance;
	}

	/**
	 * 設定を読み込んで検証済みの設定オブジェクトを返す
	 */
	public async load(): Promise<Config> {
		// 環境変数を読み込み（.envファイルとシステム環境変数）
		loadEnv();

		// 環境変数から設定を構築
		const rawConfig = {
			gitlab: {
				// 固定値
				url: "https://gitlab.com" as const,
				apiVersion: "v4" as const,
				timeout: 30000 as const,
				// 環境変数から取得
				token: process.env.GITLAB_TOKEN || "",
			},
			database: {
				host: process.env.DB_HOST || "localhost",
				port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
				database: process.env.DB_DATABASE || "",
				username: process.env.DB_USERNAME || "",
				password: process.env.DB_PASSWORD,
				ssl: process.env.DB_SSL === "true",
			},
			analysis: {
				// すべて固定値
				modules: [
					"structure",
					"quality",
					"dependencies",
					"security",
					"commits",
				] as const,
				outputFormat: "json" as const,
				cacheEnabled: true as const,
				cacheTTL: 3600 as const,
			},
		};

		// 設定を検証
		try {
			return ConfigSchema.parse(rawConfig);
		} catch (error) {
			throw new Error(
				`設定の検証に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

/**
 * 設定を読み込むヘルパー関数
 */
export async function loadConfig(): Promise<Config> {
	const loader = ConfigLoader.getInstance();
	return loader.load();
}
