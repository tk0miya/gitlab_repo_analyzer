import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数からデータベース接続情報を取得
const config: { [key: string]: Knex.Config } = {
	development: {
		client: "postgresql",
		connection: {
			host: process.env.DB_HOST || "localhost",
			port: Number(process.env.DB_PORT) || 5432,
			database: process.env.DB_NAME || "gitlab_analyzer_dev",
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASSWORD || "postgres",
		},
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: "knex_migrations",
			directory: path.join(__dirname, "migrations"),
			extension: "ts",
			loadExtensions: [".ts"],
		},
		seeds: {
			directory: path.join(__dirname, "seeds"),
			extension: "ts",
			loadExtensions: [".ts"],
		},
	},

	test: {
		client: "postgresql",
		connection: {
			host: process.env.DB_HOST || "localhost",
			port: Number(process.env.DB_PORT) || 5432,
			database: process.env.DB_NAME || "gitlab_analyzer_test",
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASSWORD || "postgres",
		},
		pool: {
			min: 1,
			max: 5,
		},
		migrations: {
			tableName: "knex_migrations",
			directory: path.join(__dirname, "migrations"),
			extension: "ts",
			loadExtensions: [".ts"],
		},
		seeds: {
			directory: path.join(__dirname, "seeds"),
			extension: "ts",
			loadExtensions: [".ts"],
		},
	},

	production: {
		client: "postgresql",
		connection: {
			host: process.env.DB_HOST || "localhost",
			port: Number(process.env.DB_PORT) || 5432,
			database: process.env.DB_NAME || "gitlab_analyzer",
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASSWORD || "postgres",
			ssl:
				process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
		},
		pool: {
			min: 2,
			max: 20,
		},
		migrations: {
			tableName: "knex_migrations",
			directory: path.join(__dirname, "migrations"),
			extension: "ts",
			loadExtensions: [".ts"],
		},
		seeds: {
			directory: path.join(__dirname, "seeds"),
			extension: "ts",
			loadExtensions: [".ts"],
		},
	},
};

export default config;
