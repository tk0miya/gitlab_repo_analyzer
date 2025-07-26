import type { NextApiRequest, NextApiResponse } from "next";

interface HealthResponse {
	status: "healthy";
	timestamp: string;
	uptime: number;
	environment: string;
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<HealthResponse>,
) {
	// Only allow GET requests
	if (req.method !== "GET") {
		res.setHeader("Allow", ["GET"]);
		res.status(405).end(`Method ${req.method} Not Allowed`);
		return;
	}

	const healthData: HealthResponse = {
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || "development",
	};

	res.status(200).json(healthData);
}
