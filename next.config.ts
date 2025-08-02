import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "2mb",
		},
	},
	eslint: {
		// Use Biome instead of ESLint
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Use existing TypeScript configuration
		ignoreBuildErrors: false,
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
