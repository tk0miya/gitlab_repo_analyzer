"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { registerProject } from "@/app/projects/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	type ProjectRegistrationData,
	projectRegistrationSchema,
} from "@/lib/validation/project-schemas";

type FormData = ProjectRegistrationData;

/**
 * プロジェクト登録フォームコンポーネント
 */
export function ProjectRegistrationForm() {
	const [state, formAction] = useFormState(registerProject, null);

	const form = useForm<FormData>({
		resolver: zodResolver(projectRegistrationSchema),
		defaultValues: {
			url: "",
		},
	});

	return (
		<Card className="max-w-2xl">
			<CardHeader>
				<CardTitle>新しいプロジェクトを登録</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form action={formAction} className="space-y-6">
						{/* エラー表示 */}
						{state && !state.success && (
							<div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
								{state.error}
							</div>
						)}

						{/* 成功表示（リダイレクト前に表示される可能性） */}
						{state?.success && state.project && (
							<div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
								プロジェクト「{state.project.name}」を正常に登録しました。
							</div>
						)}

						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GitLab プロジェクト URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://gitlab.example.com/group/project"
											{...field}
											name="url"
										/>
									</FormControl>
									<FormDescription>
										登録したいGitLabプロジェクトのURLを入力してください。 例:
										https://gitlab.com/group/project
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex gap-4">
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting
									? "登録中..."
									: "プロジェクトを登録"}
							</Button>
							<Button type="button" variant="outline" asChild>
								<Link href="/projects">キャンセル</Link>
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
