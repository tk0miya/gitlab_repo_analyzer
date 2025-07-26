import Head from "next/head";
import type React from "react";
import { useState } from "react";
import Layout from "../components/Layout";

const ProjectsPage: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");

	// Mock data - 実際の実装では API から取得
	const projects = [
		{
			id: 1,
			name: "Web Application",
			description: "メインのWebアプリケーション",
			status: "active",
			lastAnalyzed: "2025-01-25",
			qualityScore: "A",
			issuesCount: 2,
		},
		{
			id: 2,
			name: "API Server",
			description: "REST API サーバー",
			status: "active",
			lastAnalyzed: "2025-01-24",
			qualityScore: "B+",
			issuesCount: 5,
		},
		{
			id: 3,
			name: "Mobile App",
			description: "モバイルアプリケーション",
			status: "inactive",
			lastAnalyzed: "2025-01-20",
			qualityScore: "B",
			issuesCount: 8,
		},
	];

	const filteredProjects = projects.filter(
		(project) =>
			project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			project.description.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<Layout>
			<Head>
				<title>プロジェクト一覧 - GitLab Repository Analyzer</title>
				<meta name="description" content="分析対象のGitLabプロジェクト一覧" />
			</Head>

			<div className="projects">
				<div className="container">
					<div className="page-header">
						<h1 className="page-title">プロジェクト一覧</h1>
						<p className="page-description">
							分析対象のGitLabプロジェクトを管理します。
						</p>
					</div>

					<div className="projects-controls">
						<div className="search-box">
							<input
								type="text"
								placeholder="プロジェクトを検索..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="search-input"
							/>
						</div>
						<button className="btn btn-primary">
							新しいプロジェクトを追加
						</button>
					</div>

					<div className="projects-grid">
						{filteredProjects.map((project) => (
							<div key={project.id} className="project-card">
								<div className="project-header">
									<h3 className="project-name">{project.name}</h3>
									<span className={`project-status ${project.status}`}>
										{project.status === "active"
											? "アクティブ"
											: "非アクティブ"}
									</span>
								</div>

								<p className="project-description">{project.description}</p>

								<div className="project-metrics">
									<div className="metric">
										<span className="metric-label">品質スコア</span>
										<span className="metric-value">{project.qualityScore}</span>
									</div>
									<div className="metric">
										<span className="metric-label">問題数</span>
										<span className="metric-value">{project.issuesCount}</span>
									</div>
									<div className="metric">
										<span className="metric-label">最終分析</span>
										<span className="metric-value">{project.lastAnalyzed}</span>
									</div>
								</div>

								<div className="project-actions">
									<button className="btn btn-sm btn-primary">分析実行</button>
									<button className="btn btn-sm btn-secondary">詳細表示</button>
									<button className="btn btn-sm btn-outline">設定</button>
								</div>
							</div>
						))}
					</div>

					{filteredProjects.length === 0 && (
						<div className="empty-state">
							<div className="empty-state-icon">📂</div>
							<h3 className="empty-state-title">
								プロジェクトが見つかりません
							</h3>
							<p className="empty-state-description">
								検索条件に一致するプロジェクトがありません。
							</p>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
};

export default ProjectsPage;
