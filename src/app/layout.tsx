import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { GlobalNav } from "@/components/navigation/global-nav";

export const metadata: Metadata = {
	title: "GitLab Repository Analyzer",
	description: "GitLabリポジトリの構造、品質、依存関係を分析するWebツール",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja">
			<body suppressHydrationWarning>
				<GlobalNav />
				<main>{children}</main>
			</body>
		</html>
	);
}
