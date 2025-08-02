import { zodResolver } from "@hookform/resolvers/zod";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../form";

// テスト用のフォームスキーマ
const testSchema = z.object({
	username: z.string().min(1, "ユーザー名は必須です"),
	email: z.string().email("有効なメールアドレスを入力してください"),
});

type TestFormData = z.infer<typeof testSchema>;

// テスト用のフォームコンポーネント
function TestForm({ onSubmit }: { onSubmit: (data: TestFormData) => void }) {
	const form = useForm<TestFormData>({
		resolver: zodResolver(testSchema),
		defaultValues: {
			username: "",
			email: "",
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>ユーザー名</FormLabel>
							<FormControl>
								<input {...field} />
							</FormControl>
							<FormDescription>
								アカウントのユーザー名を入力してください
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>メールアドレス</FormLabel>
							<FormControl>
								<input type="email" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<button type="submit">送信</button>
			</form>
		</Form>
	);
}

describe("Form Components", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render form with all fields and descriptions", () => {
		const mockSubmit = vi.fn();
		render(<TestForm onSubmit={mockSubmit} />);

		// フィールドが正しく表示される
		expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
		expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();

		// 説明文が表示される
		expect(
			screen.getByText("アカウントのユーザー名を入力してください"),
		).toBeInTheDocument();
	});

	it("should display validation errors on invalid submission", async () => {
		const user = userEvent.setup();
		const mockSubmit = vi.fn();
		render(<TestForm onSubmit={mockSubmit} />);

		// 空のフォームを送信
		await user.click(screen.getByRole("button", { name: "送信" }));

		// バリデーションエラーが表示される
		expect(await screen.findByText("ユーザー名は必須です")).toBeInTheDocument();
	});

	it("should submit form with valid data", async () => {
		const user = userEvent.setup();
		const mockSubmit = vi.fn();
		render(<TestForm onSubmit={mockSubmit} />);

		// 有効なデータを入力
		await user.type(screen.getByLabelText("ユーザー名"), "testuser");
		await user.type(
			screen.getByLabelText("メールアドレス"),
			"test@example.com",
		);

		// フォームを送信
		await user.click(screen.getByRole("button", { name: "送信" }));

		// 送信関数が正しいデータで呼ばれる
		expect(mockSubmit).toHaveBeenCalled();
		expect(mockSubmit.mock.calls[0][0]).toEqual({
			username: "testuser",
			email: "test@example.com",
		});
	});

	it("should have accessible form structure", () => {
		const mockSubmit = vi.fn();
		render(<TestForm onSubmit={mockSubmit} />);

		// ラベルとインプットが正しく関連付けられている
		const usernameInput = screen.getByLabelText("ユーザー名");
		expect(usernameInput).toHaveAttribute("aria-describedby");

		// フォーム要素が存在する
		expect(screen.getByRole("button", { name: "送信" })).toBeInTheDocument();
	});
});
