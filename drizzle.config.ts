import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
	schema: "./src/database/schema/index.ts",
	out: "./src/database/migrations",
	dialect: "postgresql",
	dbCredentials: {
		host: process.env.DB_HOST || "localhost",
		port: Number(process.env.DB_PORT) || 5432,
		user: process.env.DB_USERNAME || "analyzer_user",
		password: process.env.DB_PASSWORD || "",
		database: process.env.DB_DATABASE || "gitlab_analyzer",
		ssl: process.env.DB_SSL === "true",
	},
	verbose: true,
	strict: true,
} satisfies Config;
