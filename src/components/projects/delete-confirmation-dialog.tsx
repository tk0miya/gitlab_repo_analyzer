"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import {
	deleteProject,
	type ProjectDeletionResult,
} from "@/app/projects/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { Project } from "@/database/schema/projects";

interface DeleteConfirmationDialogProps {
	project: Project;
	onDeleteSuccess?: () => void;
}

export function DeleteConfirmationDialog({
	project,
	onDeleteSuccess,
}: DeleteConfirmationDialogProps) {
	const [state, action, pending] = useActionState<
		ProjectDeletionResult | null,
		FormData
	>(deleteProject, null);

	// 削除成功時の処理
	if (state?.success && onDeleteSuccess) {
		onDeleteSuccess();
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="destructive"
					size="sm"
					className="gap-1"
					disabled={pending}
				>
					<Trash2 className="h-3 w-3" />
					削除
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5" />
						プロジェクトの削除
					</DialogTitle>
					<DialogDescription>
						以下のプロジェクトを削除してもよろしいですか？
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="p-3 bg-muted rounded-md">
						<p className="font-medium">{project.name}</p>
						<p className="text-sm text-muted-foreground">
							GitLab ID: {project.gitlab_id}
						</p>
					</div>
					<div className="text-sm text-destructive">
						⚠️ この操作は取り消すことができません。
					</div>
				</div>

				{state?.error && (
					<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
						<p className="text-sm text-destructive font-medium">
							エラーが発生しました
						</p>
						<p className="text-sm text-destructive">{state.error}</p>
					</div>
				)}

				<DialogFooter className="gap-2">
					<DialogTrigger asChild>
						<Button variant="outline" disabled={pending}>
							キャンセル
						</Button>
					</DialogTrigger>
					<form action={action}>
						<input type="hidden" name="projectId" value={project.id} />
						<Button
							type="submit"
							variant="destructive"
							disabled={pending}
							className="gap-2"
						>
							{pending ? (
								<>
									<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
									削除中...
								</>
							) : (
								<>
									<Trash2 className="h-3 w-3" />
									削除する
								</>
							)}
						</Button>
					</form>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
