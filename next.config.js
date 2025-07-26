/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Use Biome instead of ESLint
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Use existing TypeScript configuration
		ignoreBuildErrors: false,
	},
	// Path aliases (Next.js will automatically use tsconfig.json paths)
	experimental: {
		// Ensure TypeScript path mapping compatibility
		typedRoutes: true,
	},
	// Security headers
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
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
				],
			},
		];
	},
};

export default nextConfig;
