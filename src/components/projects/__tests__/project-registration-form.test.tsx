import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormState } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRegistrationForm } from "../project-registration-form";

// React DOMのuseFormStateをモック
vi.mock("react-dom", () => ({
	useFormState: vi.fn(),
}));

const mockUseFormState = vi.mocked(useFormState);

describe("ProjectRegistrationForm Component", () => {
	const mockFormAction = vi.fn();

	beforeEach(() => {
		// デフォルトのモック状態 (React 19のuseFormStateは3つの値を返す)
		mockUseFormState.mockReturnValue([null, mockFormAction, false]);
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("should render form with all required elements", () => {
		render(<ProjectRegistrationForm />);

		// タイトルとフィールド
		expect(screen.getByText("新しいプロジェクトを登録")).toBeInTheDocument();
		expect(
			screen.getByLabelText("GitLab プロジェクト URL"),
		).toBeInTheDocument();

		// 説明文
		expect(
			screen.getByText(/登録したいGitLabプロジェクトのURLを入力してください。/),
		).toBeInTheDocument();

		// アクションボタン
		expect(screen.getByText("プロジェクトを登録")).toBeInTheDocument();

		// キャンセルリンク
		const cancelLink = screen.getByText("キャンセル");
		expect(cancelLink).toBeInTheDocument();
		expect(cancelLink.closest("a")).toHaveAttribute("href", "/projects");
	});

	it("should accept user input in URL field", async () => {
		const user = userEvent.setup();
		render(<ProjectRegistrationForm />);

		const urlInput = screen.getByLabelText("GitLab プロジェクト URL");
		const testUrl = "https://gitlab.com/test/project";

		await user.type(urlInput, testUrl);
		expect(urlInput).toHaveValue(testUrl);
	});

	it("should display error message from server", () => {
		const errorState = {
			success: false,
			error: "プロジェクトが見つかりません",
		};

		mockUseFormState.mockReturnValue([errorState, mockFormAction, false]);
		render(<ProjectRegistrationForm />);

		expect(
			screen.getByText("プロジェクトが見つかりません"),
		).toBeInTheDocument();
	});

	it("should display success message with project name", () => {
		const successState = {
			success: true,
			project: {
				id: 1,
				name: "テストプロジェクト",
				gitlab_id: 123,
				web_url: "https://gitlab.com/test/project",
			},
		};

		mockUseFormState.mockReturnValue([successState, mockFormAction, false]);
		render(<ProjectRegistrationForm />);

		expect(
			screen.getByText(
				"プロジェクト「テストプロジェクト」を正常に登録しました。",
			),
		).toBeInTheDocument();
	});
});
