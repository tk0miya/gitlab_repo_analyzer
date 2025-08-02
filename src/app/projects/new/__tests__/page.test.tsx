import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NewProjectPage from "../page";

// ProjectRegistrationFormコンポーネントをモック
vi.mock("@/components/projects/project-registration-form", () => ({
	ProjectRegistrationForm: () => (
		<div data-testid="project-registration-form">
			Mock ProjectRegistrationForm
		</div>
	),
}));

describe("NewProjectPage", () => {
	afterEach(() => {
		cleanup();
	});

	it("ユーザーがプロジェクト登録ページを正しく利用できる", () => {
		render(<NewProjectPage />);

		// ページの目的が明確に表示される
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"プロジェクト登録",
		);
		expect(
			screen.getByText("新しいGitLabプロジェクトをシステムに登録します"),
		).toBeInTheDocument();

		// ナビゲーションが機能する
		const backLink = screen.getByRole("link", {
			name: /プロジェクト一覧に戻る/,
		});
		expect(backLink).toHaveAttribute("href", "/projects");

		// メイン機能が利用可能
		expect(screen.getByTestId("project-registration-form")).toBeInTheDocument();

		// アクセシビリティが確保されている
		expect(screen.getByRole("navigation")).toBeInTheDocument();
		expect(screen.getByRole("banner")).toBeInTheDocument();
	});

	it("ナビゲーションアイコンが表示される", () => {
		render(<NewProjectPage />);

		// 戻るリンクにアイコンが含まれている
		const backLink = screen.getByRole("link", {
			name: /プロジェクト一覧に戻る/,
		});
		const svg = backLink.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});
});
