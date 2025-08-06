"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/database/schema/projects";
import { getProjects } from "./actions";

export default function ProjectsPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchProjects() {
			try {
				const data = await getProjects();
				setProjects(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "プロジェクトの取得に失敗しました",
				);
			} finally {
				setLoading(false);
			}
		}
		fetchProjects();
	}, []);

	return (
		<div className="py-8 px-4 max-w-7xl mx-auto">
			<header className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold mb-2">プロジェクト一覧</h1>
						<p className="text-muted-foreground">
							GitLabから取得したプロジェクトの一覧を表示しています
						</p>
					</div>
					<Button asChild>
						<Link
							href="/projects/new"
							className="inline-flex items-center gap-2"
						>
							<Plus className="h-4 w-4" />
							新規プロジェクト登録
						</Link>
					</Button>
				</div>
			</header>

			{loading ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground">プロジェクトを読み込み中...</p>
				</div>
			) : error ? (
				<div className="text-center py-12">
					<p className="text-destructive">{error}</p>
				</div>
			) : projects.length === 0 ? (
				<div className="text-center py-12">
					<div className="max-w-md mx-auto">
						<div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="プロジェクトなし"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">
							プロジェクトが見つかりませんでした
						</h2>
						<p className="text-gray-600">
							GitLabからプロジェクトを同期してください
						</p>
					</div>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<ProjectCard key={project.id} project={project} />
					))}
				</div>
			)}
		</div>
	);
}
