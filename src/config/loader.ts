import { existsSync, readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { Config } from "./schema.js";
import { ConfigSchema } from "./schema.js";

/**
 * 設定ローダー - 環境変数、設定ファイル、CLI引数から設定を読み込み
 * 優先順位: CLI引数 > 環境変数 > 設定ファイル > デフォルト値
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
		// 環境変数を読み込み
		loadEnv();

		// CLI引数を解析
		const argv = await yargs(hideBin(process.argv))
			.option("config", {
				alias: "c",
				type: "string",
				description: "設定ファイルのパス",
				default: "config.json",
			})
			.option("gitlab-token", {
				type: "string",
				description: "GitLabアクセストークン",
			})
			.option("db-host", {
				type: "string",
				description: "データベースホスト",
			})
			.option("db-port", {
				type: "number",
				description: "データベースポート",
			})
			.option("db-database", {
				type: "string",
				description: "データベース名",
			})
			.option("db-username", {
				type: "string",
				description: "データベースユーザー名",
			})
			.option("db-password", {
				type: "string",
				description: "データベースパスワード",
			})
			.option("db-ssl", {
				type: "boolean",
				description: "データベースSSL接続",
			})
			.help().argv;

		// 設定ファイルを読み込み
		const configFile = this.loadConfigFile(argv.config);

		// 設定を統合（CLI引数が最優先）
		const rawConfig = {
			gitlab: {
				// 固定値
				url: "https://gitlab.com" as const,
				apiVersion: "v4" as const,
				timeout: 30000 as const,
				// 設定可能な値（優先順位: CLI > 環境変数 > 設定ファイル）
				token:
					argv.gitlabToken ||
					process.env.GITLAB_TOKEN ||
					configFile?.gitlab?.token ||
					"",
			},
			database: {
				host:
					argv.dbHost ||
					process.env.DB_HOST ||
					configFile?.database?.host ||
					"localhost",
				port:
					argv.dbPort ||
					(process.env.DB_PORT
						? parseInt(process.env.DB_PORT, 10)
						: undefined) ||
					configFile?.database?.port ||
					5432,
				database:
					argv.dbDatabase ||
					process.env.DB_DATABASE ||
					configFile?.database?.database ||
					"",
				username:
					argv.dbUsername ||
					process.env.DB_USERNAME ||
					configFile?.database?.username ||
					"",
				password:
					argv.dbPassword ||
					process.env.DB_PASSWORD ||
					configFile?.database?.password,
				ssl:
					argv.dbSsl !== undefined
						? argv.dbSsl
						: (process.env.DB_SSL
								? process.env.DB_SSL === "true"
								: undefined) ||
							configFile?.database?.ssl ||
							false,
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

	/**
	 * 設定ファイルを読み込み（存在しない場合は空オブジェクト）
	 */
	private loadConfigFile(configPath: string): Partial<Config> {
		try {
			if (!existsSync(configPath)) {
				return {};
			}

			const fileContent = readFileSync(configPath, "utf8");
			return JSON.parse(fileContent);
		} catch (error) {
			console.warn(
				`設定ファイルの読み込みに失敗しました (${configPath}):`,
				error,
			);
			return {};
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
