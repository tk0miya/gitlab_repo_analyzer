import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/database/schema/projects";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface ProjectCardProps {
	project: Project;
}

const visibilityConfig = {
	public: { label: "パブリック", variant: "default" as const },
	internal: { label: "内部", variant: "secondary" as const },
	private: { label: "プライベート", variant: "destructive" as const },
};

export function ProjectCard({ project }: ProjectCardProps) {
	const visibilityInfo = visibilityConfig[
		project.visibility as keyof typeof visibilityConfig
	] || {
		label: project.visibility,
		variant: "outline" as const,
	};

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="flex items-start justify-between">
					<CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
					<Badge variant={visibilityInfo.variant} className="ml-2 shrink-0">
						{visibilityInfo.label}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{project.description && (
					<p className="text-sm text-muted-foreground line-clamp-3">
						{project.description}
					</p>
				)}

				<div className="space-y-3">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>ID: {project.gitlab_id}</span>
						<Link
							href={project.web_url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
						>
							GitLab
							<svg
								className="w-3 h-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="外部リンク"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
						</Link>
					</div>

					<div className="flex justify-end">
						<DeleteConfirmationDialog project={project} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
