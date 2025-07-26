import Head from "next/head";
import type React from "react";
import Layout from "../components/Layout";

const DashboardPage: React.FC = () => {
	return (
		<Layout>
			<Head>
				<title>ダッシュボード - GitLab Repository Analyzer</title>
				<meta
					name="description"
					content="プロジェクトメトリクスとリアルタイム分析の概要"
				/>
			</Head>

			<div className="dashboard">
				<div className="container">
					<div className="page-header">
						<h1 className="page-title">ダッシュボード</h1>
						<p className="page-description">
							プロジェクトのメトリクスと分析結果をリアルタイムで表示します。
						</p>
					</div>

					<div className="dashboard-grid">
						<div className="dashboard-card">
							<h3 className="card-title">プロジェクト概要</h3>
							<div className="metric-value">12</div>
							<div className="metric-label">アクティブプロジェクト</div>
						</div>

						<div className="dashboard-card">
							<h3 className="card-title">コード品質</h3>
							<div className="metric-value">A</div>
							<div className="metric-label">平均品質評価</div>
						</div>

						<div className="dashboard-card">
							<h3 className="card-title">セキュリティ</h3>
							<div className="metric-value">3</div>
							<div className="metric-label">要対応の問題</div>
						</div>

						<div className="dashboard-card">
							<h3 className="card-title">パフォーマンス</h3>
							<div className="metric-value">95%</div>
							<div className="metric-label">平均スコア</div>
						</div>
					</div>

					<div className="dashboard-charts">
						<div className="chart-container">
							<h3 className="chart-title">コミット活動</h3>
							<div className="chart-placeholder">
								<p>チャートが表示されます（Chart.js等で実装予定）</p>
							</div>
						</div>

						<div className="chart-container">
							<h3 className="chart-title">問題の傾向</h3>
							<div className="chart-placeholder">
								<p>チャートが表示されます（Chart.js等で実装予定）</p>
							</div>
						</div>
					</div>

					<div className="recent-activities">
						<h3 className="section-title">最近のアクティビティ</h3>
						<div className="activity-list">
							<div className="activity-item">
								<div className="activity-icon">📊</div>
								<div className="activity-content">
									<div className="activity-title">
										プロジェクト "Web App" の分析が完了しました
									</div>
									<div className="activity-time">2分前</div>
								</div>
							</div>
							<div className="activity-item">
								<div className="activity-icon">⚠️</div>
								<div className="activity-content">
									<div className="activity-title">
										新しいセキュリティ問題が検出されました
									</div>
									<div className="activity-time">15分前</div>
								</div>
							</div>
							<div className="activity-item">
								<div className="activity-icon">✅</div>
								<div className="activity-content">
									<div className="activity-title">
										プロジェクト "API Server" の品質が改善されました
									</div>
									<div className="activity-time">1時間前</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default DashboardPage;
