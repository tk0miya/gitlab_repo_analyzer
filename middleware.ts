import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// CORS configuration
const corsOptions = {
	allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"X-CSRF-Token",
		"X-Requested-With",
		"Accept",
		"Accept-Version",
		"Content-Length",
		"Content-MD5",
		"Content-Type",
		"Date",
		"X-Api-Version",
		"Authorization",
	],
	allowedOrigins:
		process.env.NODE_ENV === "production"
			? [process.env.ALLOWED_ORIGIN || "https://your-domain.com"]
			: ["http://localhost:3000", "http://127.0.0.1:3000"],
	credentials: true,
};

// Security headers
const securityHeaders = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"X-XSS-Protection": "1; mode=block",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-eval' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self'",
		"connect-src 'self' ws: wss:",
		"media-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"upgrade-insecure-requests",
	].join("; "),
	"Permissions-Policy": [
		"camera=()",
		"microphone=()",
		"geolocation=()",
		"payment=()",
		"usb=()",
	].join(", "),
};

// Rate limiting (simple in-memory store for development)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

function rateLimit(ip: string): boolean {
	const now = Date.now();
	const record = rateLimitMap.get(ip);

	if (!record) {
		rateLimitMap.set(ip, { count: 1, lastReset: now });
		return false;
	}

	// Reset window if expired
	if (now - record.lastReset > RATE_LIMIT_WINDOW) {
		record.count = 1;
		record.lastReset = now;
		return false;
	}

	// Check if limit exceeded
	if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
		return true;
	}

	record.count++;
	return false;
}

export function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;
	const requestHeaders = new Headers(request.headers);

	// Get client IP for rate limiting
	const ip =
		requestHeaders.get("x-forwarded-for") ||
		requestHeaders.get("x-real-ip") ||
		"unknown";

	// Apply rate limiting to API routes
	if (pathname.startsWith("/api/")) {
		if (rateLimit(ip)) {
			return new NextResponse(
				JSON.stringify({
					error: "Too Many Requests",
					message: "Rate limit exceeded. Please try again later.",
					retryAfter: 60,
				}),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						"Retry-After": "60",
						...securityHeaders,
					},
				},
			);
		}
	}

	// Handle CORS preflight
	if (request.method === "OPTIONS") {
		const origin = requestHeaders.get("origin");
		const allowedOrigin = corsOptions.allowedOrigins.includes(origin || "")
			? origin
			: corsOptions.allowedOrigins[0];

		return new NextResponse(null, {
			status: 200,
			headers: {
				"Access-Control-Allow-Origin": allowedOrigin || "*",
				"Access-Control-Allow-Methods": corsOptions.allowedMethods.join(", "),
				"Access-Control-Allow-Headers": corsOptions.allowedHeaders.join(", "),
				"Access-Control-Allow-Credentials": corsOptions.credentials.toString(),
				"Access-Control-Max-Age": "86400",
				...securityHeaders,
			},
		});
	}

	// Create response
	const response = NextResponse.next();

	// Add security headers to all responses
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	// Add CORS headers for API routes
	if (pathname.startsWith("/api/")) {
		const origin = requestHeaders.get("origin");
		const allowedOrigin = corsOptions.allowedOrigins.includes(origin || "")
			? origin
			: corsOptions.allowedOrigins[0];

		response.headers.set("Access-Control-Allow-Origin", allowedOrigin || "*");
		response.headers.set(
			"Access-Control-Allow-Credentials",
			corsOptions.credentials.toString(),
		);
		response.headers.set(
			"Access-Control-Allow-Methods",
			corsOptions.allowedMethods.join(", "),
		);
		response.headers.set(
			"Access-Control-Allow-Headers",
			corsOptions.allowedHeaders.join(", "),
		);
	}

	// Add custom headers for monitoring
	response.headers.set("X-Request-ID", crypto.randomUUID());
	response.headers.set("X-Response-Time", Date.now().toString());

	// Add cache control for static assets
	if (pathname.startsWith("/_next/static/") || pathname.includes(".")) {
		response.headers.set(
			"Cache-Control",
			"public, max-age=31536000, immutable",
		);
	}

	// No caching for API routes and pages
	if (
		pathname.startsWith("/api/") ||
		(!pathname.includes(".") && pathname !== "/")
	) {
		response.headers.set(
			"Cache-Control",
			"no-cache, no-store, must-revalidate",
		);
		response.headers.set("Pragma", "no-cache");
		response.headers.set("Expires", "0");
	}

	return response;
}

// Configure middleware to run on specific paths
export const config = {
	matcher: [
		// Match all API routes
		"/api/:path*",
		// Match all pages except static files
		"/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
	],
};
