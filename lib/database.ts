import { and, count, desc, eq, like, or } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadConfig } from "../src/config";
import * as schema from "../src/database/schema";

// Re-export schema for convenience
export { schema };

// Database connection singleton
let dbInstance: NodePgDatabase<typeof schema> | null = null;
let poolInstance: Pool | null = null;

/**
 * Get database connection instance
 * Creates a singleton connection to be reused across the application
 */
export async function getDatabase(): Promise<NodePgDatabase<typeof schema>> {
	if (!dbInstance) {
		const config = await loadConfig();

		// Create connection pool
		poolInstance = new Pool({
			host: config.database.host,
			port: config.database.port,
			database: config.database.database,
			user: config.database.username,
			password: config.database.password,
			ssl: config.database.ssl,
			max: 20, // Maximum number of clients in the pool
			idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
			connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
		});

		// Create Drizzle instance
		dbInstance = drizzle(poolInstance, { schema });

		// Handle process shutdown
		process.on("SIGINT", async () => {
			if (poolInstance) {
				await poolInstance.end();
				console.log("Database connection pool closed.");
			}
		});

		process.on("SIGTERM", async () => {
			if (poolInstance) {
				await poolInstance.end();
				console.log("Database connection pool closed.");
			}
		});
	}

	return dbInstance;
}

/**
 * Close database connection
 * Useful for testing or graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
	if (poolInstance) {
		await poolInstance.end();
		poolInstance = null;
		dbInstance = null;
	}
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<{
	status: "connected" | "disconnected";
	latency?: number;
	error?: string;
}> {
	try {
		const startTime = Date.now();
		const db = await getDatabase();

		// Simple query to test connection
		await db.execute("SELECT 1");

		const latency = Date.now() - startTime;

		return {
			status: "connected",
			latency,
		};
	} catch (error) {
		console.error("Database health check failed:", error);
		return {
			status: "disconnected",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Execute database transaction
 * Provides a safe way to run multiple queries in a transaction
 */
export async function withTransaction<T>(
	callback: (tx: NodePgDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
	const db = await getDatabase();
	return db.transaction(callback);
}

/**
 * Database utilities for common operations
 */
export class DatabaseUtils {
	private db: NodePgDatabase<typeof schema>;

	constructor(db: NodePgDatabase<typeof schema>) {
		this.db = db;
	}

	/**
	 * Get projects with pagination
	 */
	async getProjects(page = 1, limit = 10) {
		const offset = (page - 1) * limit;

		return this.db.select().from(schema.projects).limit(limit).offset(offset);
	}

	/**
	 * Get project by ID with related data
	 */
	async getProjectById(id: number) {
		const [project] = await this.db
			.select()
			.from(schema.projects)
			.where(eq(schema.projects.id, id))
			.limit(1);

		if (!project) {
			return null;
		}

		// Get related commits
		const commits = await this.db
			.select()
			.from(schema.commits)
			.where(eq(schema.commits.project_id, id))
			.orderBy(desc(schema.commits.created_at))
			.limit(10);

		return {
			...project,
			recentCommits: commits,
		};
	}

	/**
	 * Get sync logs for monitoring
	 */
	async getSyncLogs(projectId?: number, limit = 50) {
		if (projectId) {
			return this.db
				.select()
				.from(schema.syncLogs)
				.where(eq(schema.syncLogs.project_id, projectId))
				.orderBy(desc(schema.syncLogs.started_at))
				.limit(limit);
		}

		return this.db
			.select()
			.from(schema.syncLogs)
			.orderBy(desc(schema.syncLogs.started_at))
			.limit(limit);
	}

	/**
	 * Get dashboard statistics
	 */
	async getDashboardStats() {
		const [projectCount] = await this.db
			.select({ count: count(schema.projects.id) })
			.from(schema.projects);

		const [commitCount] = await this.db
			.select({ count: count(schema.commits.id) })
			.from(schema.commits);

		const recentSyncs = await this.db
			.select()
			.from(schema.syncLogs)
			.orderBy(desc(schema.syncLogs.started_at))
			.limit(5);

		return {
			totalProjects: projectCount?.count || 0,
			totalCommits: commitCount?.count || 0,
			recentSyncs,
		};
	}

	/**
	 * Search projects by name or description
	 */
	async searchProjects(query: string, limit = 20) {
		return this.db
			.select()
			.from(schema.projects)
			.where(
				or(
					like(schema.projects.name, `%${query}%`),
					like(schema.projects.description, `%${query}%`),
				),
			)
			.limit(limit);
	}
}

/**
 * Get database utilities instance
 */
export async function getDatabaseUtils(): Promise<DatabaseUtils> {
	const db = await getDatabase();
	return new DatabaseUtils(db);
}

/**
 * Migration utilities
 */
export class MigrationUtils {
	static async runPendingMigrations(): Promise<void> {
		// This would typically use drizzle-kit or a custom migration runner
		console.log("Running pending migrations...");
		// Implementation would depend on your migration strategy
	}

	static async rollbackMigration(steps = 1): Promise<void> {
		console.log(`Rolling back ${steps} migration(s)...`);
		// Implementation would depend on your migration strategy
	}
}

/**
 * Export types for use in API routes
 */
export type Database = NodePgDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<
	Parameters<Database["transaction"]>[0]
>[0];
