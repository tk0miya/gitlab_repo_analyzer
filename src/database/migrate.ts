import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDatabase } from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * マイグレーションの実行
 */
export async function runMigrations(): Promise<void> {
	const db = await getDatabase();
	const migrationsFolder = path.join(__dirname, "migrations");

	try {
		console.log("Running database migrations...");
		await migrate(db, { migrationsFolder });
		console.log("Database migrations completed successfully");
	} catch (error) {
		console.error("Migration failed:", error);
		throw error;
	}
}

/**
 * マイグレーションの実行（エラーハンドリング付き）
 */
export async function runMigrationsWithErrorHandling(): Promise<boolean> {
	try {
		await runMigrations();
		return true;
	} catch (error) {
		console.error("Failed to run migrations:", error);
		return false;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	// 直接実行された場合
	runMigrationsWithErrorHandling()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error("Migration script failed:", error);
			process.exit(1);
		});
}
