import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProjectRegistrationForm } from "@/components/projects/project-registration-form";

export default function NewProjectPage() {
	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			{/* パンくずリスト */}
			<nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
				<Link
					href="/projects"
					className="flex items-center hover:text-foreground transition-colors"
				>
					<ChevronLeft className="h-4 w-4" />
					プロジェクト一覧に戻る
				</Link>
			</nav>

			{/* ページヘッダー */}
			<header className="mb-8">
				<h1 className="text-3xl font-bold">プロジェクト登録</h1>
				<p className="text-muted-foreground mt-2">
					新しいGitLabプロジェクトをシステムに登録します
				</p>
			</header>

			{/* 登録フォーム */}
			<ProjectRegistrationForm />
		</div>
	);
}
