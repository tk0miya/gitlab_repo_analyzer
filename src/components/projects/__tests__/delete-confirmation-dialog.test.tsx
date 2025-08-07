import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildProject } from "@/lib/testing/factories";
import { DeleteConfirmationDialog } from "../delete-confirmation-dialog";

// Server Actionをモック
vi.mock("@/app/projects/actions", () => ({
	deleteProject: vi.fn(),
}));

describe("DeleteConfirmationDialog", () => {
	const mockProject = buildProject({
		id: 1,
		name: "テストプロジェクト",
		gitlab_id: 123,
	});

	it("削除ボタンが表示される", () => {
		const mockOnDeleteSuccess = vi.fn();

		render(
			<DeleteConfirmationDialog
				project={mockProject}
				onDeleteSuccess={mockOnDeleteSuccess}
			/>,
		);

		const deleteButton = screen.getByRole("button", { name: /削除/ });
		expect(deleteButton).toBeInTheDocument();
		expect(deleteButton).toHaveClass("gap-1");
	});

	it("確認ダイアログが正しい内容で表示される", async () => {
		render(<DeleteConfirmationDialog project={mockProject} />);

		const deleteButton = screen.getAllByRole("button", { name: /削除/ })[0];
		fireEvent.click(deleteButton);

		// ダイアログの全ての要素が正しく表示されることを確認
		await waitFor(() => {
			// ダイアログタイトル
			expect(screen.getByText("プロジェクトの削除")).toBeInTheDocument();

			// プロジェクト情報
			expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
			expect(screen.getByText("GitLab ID: 123")).toBeInTheDocument();

			// 警告メッセージ
			expect(
				screen.getByText("⚠️ この操作は取り消すことができません。"),
			).toBeInTheDocument();

			// アクションボタン
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /削除する/ }),
			).toBeInTheDocument();

			// hiddenフィールド
			const hiddenInput = screen.getByDisplayValue("1");
			expect(hiddenInput).toBeInTheDocument();
			expect(hiddenInput).toHaveAttribute("type", "hidden");
			expect(hiddenInput).toHaveAttribute("name", "projectId");
		});
	});
});
