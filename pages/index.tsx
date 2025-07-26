import Head from "next/head";
import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

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

			<main className={styles.main}>
				<header className={styles.header}>
					<h1 className={styles.title}>GitLab Repository Analyzer</h1>
					<p className={styles.subtitle}>
						GitLabリポジトリの構造、品質、依存関係を分析するWebツール
					</p>
				</header>

				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>システム状態</h2>

					{loading ? (
						<p>ヘルスチェック中...</p>
					) : healthData ? (
						<div className={styles.healthGrid}>
							<div>
								<strong>ステータス:</strong>
								<span
									className={
										healthData.status === "healthy"
											? styles.statusHealthy
											: styles.statusUnhealthy
									}
								>
									{healthData.status === "healthy" ? "正常" : "異常"}
								</span>
							</div>
							<div>
								<strong>最終確認:</strong>{" "}
								{new Date(healthData.timestamp).toLocaleString("ja-JP")}
							</div>
							<div>
								<strong>稼働時間:</strong> {Math.floor(healthData.uptime)}秒
							</div>
							<div>
								<strong>環境:</strong> {healthData.environment}
							</div>
						</div>
					) : (
						<p className={styles.errorText}>
							ヘルスチェックの取得に失敗しました
						</p>
					)}
				</section>
			</main>
		</>
	);
}
