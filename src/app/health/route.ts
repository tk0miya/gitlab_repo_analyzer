import { NextResponse } from "next/server";

interface HealthResponse {
	status: "healthy";
	timestamp: string;
	uptime: number;
	environment: string;
}

export async function GET() {
	const healthData: HealthResponse = {
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || "development",
	};

	return NextResponse.json(healthData);
}
