"use client";

import { ArrowLeft, GitBranch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommitGraph } from "@/components/commits/commit-graph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectVisibilityBadge } from "@/components/ui/project-visibility-badge";
import type { MonthlyCommitData } from "@/database/repositories/commits";
import type { ProjectWithStats } from "@/database/schema/projects";
import { getMonthlyCommitCounts, getProjectDetail } from "../actions";

interface PageProps {
	params: { id: string };
}

export default function ProjectDetailPage({ params }: PageProps) {
	const [project, setProject] = useState<ProjectWithStats | null>(null);
	const [monthlyData, setMonthlyData] = useState<MonthlyCommitData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const projectId = Number.parseInt(params.id, 10);

	if (Number.isNaN(projectId)) {
		notFound();
	}

	const fetchProjectData = useCallback(async () => {
		try {
			setLoading(true);

			const [projectData, commitData] = await Promise.all([
				getProjectDetail(projectId),
				getMonthlyCommitCounts(projectId),
			]);

			if (!projectData) {
				notFound();
			}

			setProject(projectData);
			setMonthlyData(commitData);
			setError(null);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "データの取得に失敗しました",
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		fetchProjectData();
	}, [fetchProjectData]);

	if (loading) {
		return (
			<div className="py-8 px-4 max-w-7xl mx-auto">
				<div className="mb-8">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/projects" className="inline-flex items-center gap-2">
							<ArrowLeft className="h-4 w-4" />
							プロジェクト一覧に戻る
						</Link>
					</Button>
				</div>
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						プロジェクト情報を読み込み中...
					</p>
				</div>
			</div>
		);
	}

	if (error || !project) {
		return (
			<div className="py-8 px-4 max-w-7xl mx-auto">
				<div className="mb-8">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/projects" className="inline-flex items-center gap-2">
							<ArrowLeft className="h-4 w-4" />
							プロジェクト一覧に戻る
						</Link>
					</Button>
				</div>
				<div className="text-center py-12">
					<p className="text-destructive">
						{error || "プロジェクトが見つかりませんでした"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="py-8 px-4 max-w-7xl mx-auto">
			{/* ヘッダー */}
			<header className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/projects" className="inline-flex items-center gap-2">
							<ArrowLeft className="h-4 w-4" />
							プロジェクト一覧に戻る
						</Link>
					</Button>
				</div>

				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
							<h1 className="text-3xl font-bold">{project.name}</h1>
							<ProjectVisibilityBadge visibility={project.visibility} />
						</div>
						{project.description && (
							<p className="text-muted-foreground mb-4">
								{project.description}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center gap-6 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<GitBranch className="h-4 w-4" />
						デフォルトブランチ: {project.default_branch}
					</div>
					<div>GitLab ID: {project.gitlab_id}</div>
					<Link
						href={project.web_url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:text-blue-800 transition-colors"
					>
						GitLabで表示
					</Link>
				</div>
			</header>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* 統計情報サマリー */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle>統計情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between">
								<span>総コミット数</span>
								<span className="font-semibold">{project.commitCount}</span>
							</div>
							<div className="flex justify-between">
								<span>最終更新</span>
								<span className="font-semibold">
									{project.lastCommitDate
										? new Date(project.lastCommitDate).toLocaleDateString(
												"ja-JP",
											)
										: "未同期"}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* コミット分析 */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>月別コミット数</CardTitle>
						</CardHeader>
						<CardContent>
							<CommitGraph data={monthlyData} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
