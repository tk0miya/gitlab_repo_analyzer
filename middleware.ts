import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	// Create response
	const response = NextResponse.next();

	// Add security headers
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// CORS for API routes
	if (request.nextUrl.pathname.startsWith("/api/")) {
		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		response.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		);
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
