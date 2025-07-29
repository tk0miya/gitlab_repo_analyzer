import Head from "next/head";
import { useEffect, useState } from "react";

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
					<h1 className="text-3xl font-bold mb-2">GitLab Repository Analyzer</h1>
					<p className="text-gray-600">
						GitLabリポジトリの構造、品質、依存関係を分析するWebツール
					</p>
				</header>

				<section className="bg-white shadow rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">システム状態</h2>

					{loading ? (
						<p className="text-gray-500">ヘルスチェック中...</p>
					) : healthData ? (
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<strong>ステータス:</strong>
								<span
									className={
										healthData.status === "healthy"
											? "text-green-600 ml-2"
											: "text-red-600 ml-2"
									}
								>
									{healthData.status === "healthy" ? "正常" : "異常"}
								</span>
							</div>
							<div>
								<strong>最終確認:</strong>{" "}
								<span className="text-gray-600">
									{new Date(healthData.timestamp).toLocaleString("ja-JP")}
								</span>
							</div>
							<div>
								<strong>稼働時間:</strong> 
								<span className="text-gray-600 ml-1">
									{Math.floor(healthData.uptime)}秒
								</span>
							</div>
							<div>
								<strong>環境:</strong> 
								<span className="text-gray-600 ml-1">
									{healthData.environment}
								</span>
							</div>
						</div>
					) : (
						<p className="text-red-600">
							ヘルスチェックの取得に失敗しました
						</p>
					)}
				</section>
			</main>
		</>
	);
}
