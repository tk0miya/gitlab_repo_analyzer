import Head from "next/head";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthData {
	status: string;
	timestamp: string;
	uptime: number;
	environment: string;
}

export default function Home() {
	const [healthData, setHealthData] = useState<HealthData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchHealth() {
			try {
				const response = await fetch("/api/health");
				const data = await response.json();
				setHealthData(data);
			} catch (error) {
				console.error("ヘルスチェックの取得に失敗しました:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchHealth();
	}, []);

	return (
		<>
			<Head>
				<title>GitLab Repository Analyzer</title>
				<meta
					name="description"
					content="GitLabリポジトリを分析するWebツール"
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>

			<main className="py-8 px-4 max-w-4xl mx-auto">
				<header className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2">
						GitLab Repository Analyzer
					</h1>
					<p className="text-muted-foreground">
						GitLabリポジトリの構造、品質、依存関係を分析するWebツール
					</p>
				</header>

				<Card>
					<CardHeader>
						<CardTitle>システム状態</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<p className="text-muted-foreground">ヘルスチェック中...</p>
						) : healthData ? (
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="flex items-center gap-2">
									<strong>ステータス:</strong>
									<Badge
										variant={
											healthData.status === "healthy"
												? "default"
												: "destructive"
										}
									>
										{healthData.status === "healthy" ? "正常" : "異常"}
									</Badge>
								</div>
								<div>
									<strong>最終確認:</strong>{" "}
									<span className="text-muted-foreground ml-1">
										{new Date(healthData.timestamp).toLocaleString("ja-JP")}
									</span>
								</div>
								<div>
									<strong>稼働時間:</strong>
									<span className="text-muted-foreground ml-1">
										{Math.floor(healthData.uptime)}秒
									</span>
								</div>
								<div>
									<strong>環境:</strong>
									<span className="text-muted-foreground ml-1">
										{healthData.environment}
									</span>
								</div>
							</div>
						) : (
							<p className="text-destructive">
								ヘルスチェックの取得に失敗しました
							</p>
						)}
					</CardContent>
				</Card>
			</main>
		</>
	);
}
