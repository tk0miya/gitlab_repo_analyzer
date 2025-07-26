import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

interface HealthResponse {
	status: "healthy" | "unhealthy";
	timestamp: string;
	version: string;
	uptime: number;
	services: {
		database: "connected" | "disconnected";
		gitlab_api: "available" | "unavailable";
		[key: string]: string;
	};
	memory: {
		used: number;
		total: number;
		percentage: number;
	};
	environment: string;
}

const healthResponseSchema = z.object({
	status: z.enum(["healthy", "unhealthy"]),
	timestamp: z.string(),
	version: z.string(),
	uptime: z.number(),
	services: z.object({
		database: z.enum(["connected", "disconnected"]),
		gitlab_api: z.enum(["available", "unavailable"]),
	}),
	memory: z.object({
		used: z.number(),
		total: z.number(),
		percentage: z.number(),
	}),
	environment: z.string(),
});

// Helper function to check database connection
async function checkDatabaseConnection(): Promise<
	"connected" | "disconnected"
> {
	try {
		// TODO: 実際のDrizzle ORM接続チェックを実装
		// const db = await getDatabaseConnection();
		// await db.select().from(projects).limit(1);
		return "connected";
	} catch (error) {
		console.error("Database health check failed:", error);
		return "disconnected";
	}
}

// Helper function to check GitLab API availability
async function checkGitLabAPI(): Promise<"available" | "unavailable"> {
	try {
		// TODO: GitLab API接続チェックを実装
		// const response = await fetch(`${GITLAB_URL}/api/v4/version`);
		// return response.ok ? 'available' : 'unavailable';
		return "available";
	} catch (error) {
		console.error("GitLab API health check failed:", error);
		return "unavailable";
	}
}

// Helper function to get memory usage
function getMemoryUsage() {
	const memUsage = process.memoryUsage();
	const totalMemory = memUsage.heapTotal;
	const usedMemory = memUsage.heapUsed;

	return {
		used: Math.round(usedMemory / 1024 / 1024), // MB
		total: Math.round(totalMemory / 1024 / 1024), // MB
		percentage: Math.round((usedMemory / totalMemory) * 100),
	};
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<HealthResponse | { error: string }>,
) {
	// Only allow GET requests
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const startTime = Date.now();

		// Check all services in parallel
		const [databaseStatus, gitlabApiStatus] = await Promise.all([
			checkDatabaseConnection(),
			checkGitLabAPI(),
		]);

		const memory = getMemoryUsage();
		const uptime = process.uptime();

		// Determine overall health status
		const isHealthy =
			databaseStatus === "connected" && gitlabApiStatus === "available";

		const healthData: HealthResponse = {
			status: isHealthy ? "healthy" : "unhealthy",
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || "1.0.0",
			uptime: Math.round(uptime),
			services: {
				database: databaseStatus,
				gitlab_api: gitlabApiStatus,
			},
			memory,
			environment: process.env.NODE_ENV || "development",
		};

		// Validate response schema
		const validatedData = healthResponseSchema.parse(healthData);

		const responseTime = Date.now() - startTime;

		// Set cache headers
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");
		res.setHeader("X-Response-Time", `${responseTime}ms`);

		// Return appropriate status code
		const statusCode = isHealthy ? 200 : 503;
		return res.status(statusCode).json(validatedData);
	} catch (error) {
		console.error("Health check error:", error);

		return res.status(500).json({
			error: "Internal server error during health check",
		});
	}
}
