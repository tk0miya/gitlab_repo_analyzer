"use client";

import { ArrowLeft, GitBranch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { CommitAnalysisCard } from "@/components/commits/commit-analysis-card";
import { CommitterRankingCard } from "@/components/commits/committer-ranking-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectVisibilityBadge } from "@/components/ui/project-visibility-badge";
import type {
	AnalysisPeriod,
	CommitStats,
	CommitterRanking,
	RankingPeriod,
} from "@/database/repositories/commits";
import type { ProjectWithStats } from "@/database/schema/projects";
import {
	getCommitterRanking,
	getMonthlyCommitStats,
	getProjectDetail,
	getWeeklyCommitStats,
} from "../actions";

interface PageProps {
	params: { id: string };
}

export default function ProjectDetailPage({ params }: PageProps) {
	const [project, setProject] = useState<ProjectWithStats | null>(null);
	const [monthlyStats, setMonthlyStats] = useState<CommitStats[]>([]);
	const [weeklyStats, setWeeklyStats] = useState<CommitStats[]>([]);
	const [analysisPeriod, setAnalysisPeriod] =
		useState<AnalysisPeriod>("monthly");
	const [rankings, setRankings] = useState<
		Record<RankingPeriod, CommitterRanking[]>
	>({
		all: [],
		year: [],
		halfYear: [],
		month: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const projectId = Number.parseInt(params.id, 10);

	if (Number.isNaN(projectId)) {
		notFound();
	}

	useEffect(() => {
		const fetchProjectData = async () => {
			try {
				setLoading(true);

				const projectData = await getProjectDetail(projectId);

				if (!projectData) {
					notFound();
				}

				setProject(projectData);
				setError(null);

				// 全期間のランキングを初期ロード
				const allRankings = await getCommitterRanking(projectId, "all");
				setRankings((prev) => ({ ...prev, all: allRankings }));
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "データの取得に失敗しました",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchProjectData();
	}, [projectId]);

	// period変更時に必要なデータを取得
	useEffect(() => {
		const fetchCommitStats = async () => {
			try {
				if (analysisPeriod === "monthly") {
					// 月別データが未ロードの場合のみ取得
					if (monthlyStats.length === 0) {
						const stats = await getMonthlyCommitStats(projectId);
						setMonthlyStats(stats);
					}
				} else {
					// 週別データが未ロードの場合のみ取得
					if (weeklyStats.length === 0) {
						const stats = await getWeeklyCommitStats(projectId);
						setWeeklyStats(stats);
					}
				}
			} catch (err) {
				console.error("コミット統計データの取得に失敗しました:", err);
			}
		};

		fetchCommitStats();
	}, [projectId, analysisPeriod, monthlyStats?.length, weeklyStats?.length]);

	// ランキング期間変更時のデータ取得
	const handleRankingPeriodChange = async (period: RankingPeriod) => {
		try {
			// まだロードしていない期間のデータのみ取得
			if (rankings[period].length === 0) {
				const rankingData = await getCommitterRanking(projectId, period);
				setRankings((prev) => ({ ...prev, [period]: rankingData }));
			}
		} catch (err) {
			console.error("ランキングデータの取得に失敗しました:", err);
		}
	};

	// 現在選択されているperiodのデータを取得
	const commitStats = analysisPeriod === "monthly" ? monthlyStats : weeklyStats;

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

			<div className="space-y-6">
				{/* 統計情報とコミット分析 */}
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
						<CommitAnalysisCard
							period={analysisPeriod}
							commitStats={commitStats}
							onPeriodChange={setAnalysisPeriod}
						/>
					</div>
				</div>

				{/* コミッターランキング */}
				<div>
					<CommitterRankingCard
						rankings={rankings}
						onPeriodChange={handleRankingPeriodChange}
					/>
				</div>
			</div>
		</div>
	);
}
