import Head from "next/head";
import Link from "next/link";
import type React from "react";
import Layout from "../components/Layout";

const HomePage: React.FC = () => {
	return (
		<Layout>
			<Head>
				<title>GitLab Repository Analyzer</title>
				<meta
					name="description"
					content="GitLabリポジトリを分析するWebアプリケーション"
				/>
			</Head>

			<div className="hero-section">
				<div className="container">
					<div className="hero-content">
						<h1 className="hero-title">GitLab Repository Analyzer</h1>
						<p className="hero-description">
							GitLabリポジトリの詳細な分析を行い、プロジェクトの健全性とメトリクスを可視化します。
						</p>
						<div className="hero-actions">
							<Link href="/projects" className="btn btn-primary">
								プロジェクト一覧
							</Link>
							<Link href="/dashboard" className="btn btn-secondary">
								ダッシュボード
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className="features-section">
				<div className="container">
					<h2 className="section-title">主な機能</h2>
					<div className="features-grid">
						<div className="feature-card">
							<div className="feature-icon">📊</div>
							<h3>リポジトリ分析</h3>
							<p>コード品質、依存関係、セキュリティ脆弱性の包括的な分析</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon">📈</div>
							<h3>メトリクス可視化</h3>
							<p>プロジェクトの健全性指標をリアルタイムで可視化</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon">🔍</div>
							<h3>コミット履歴分析</h3>
							<p>開発者のアクティビティとコード変更の傾向を分析</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon">⚡</div>
							<h3>自動化レポート</h3>
							<p>定期的な分析レポートの自動生成と配信</p>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default HomePage;
