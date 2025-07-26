/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable strict mode for better development experience
	reactStrictMode: true,

	// SWC minification is enabled by default in Next.js 15

	// Configure security headers
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "Content-Security-Policy",
						value:
							"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:;",
					},
				],
			},
		];
	},

	// Handle ESM compatibility
	experimental: {
		esmExternals: true,
	},

	// Configure static file serving
	trailingSlash: false,

	// API route configuration
	pageExtensions: ["ts", "tsx", "js", "jsx"],

	// Environment variables
	env: {
		CUSTOM_KEY: process.env.CUSTOM_KEY,
	},
};

export default nextConfig;
