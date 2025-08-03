import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogFooter, DialogHeader, DialogTrigger } from "../dialog";

describe("Dialog Components", () => {
	it("DialogTriggerが正しくレンダリングされる", () => {
		render(
			<Dialog>
				<DialogTrigger>トリガーボタン</DialogTrigger>
			</Dialog>,
		);

		const trigger = screen.getByText("トリガーボタン");
		expect(trigger).toBeInTheDocument();
		expect(trigger).toHaveAttribute("type", "button");
	});

	it("DialogHeaderに正しいクラスが適用される", () => {
		const { container } = render(
			<DialogHeader>
				<div>ヘッダーコンテンツ</div>
			</DialogHeader>,
		);

		const headerElement = container.querySelector(
			".flex.flex-col.space-y-1\\.5",
		);
		expect(headerElement).toBeInTheDocument();
		expect(screen.getByText("ヘッダーコンテンツ")).toBeInTheDocument();
	});

	it("DialogFooterに正しいクラスが適用される", () => {
		const { container } = render(
			<DialogFooter>
				<button type="button">テストボタン</button>
			</DialogFooter>,
		);

		const footerElement = container.querySelector(
			".flex.flex-col-reverse.sm\\:flex-row",
		);
		expect(footerElement).toBeInTheDocument();
		expect(screen.getByText("テストボタン")).toBeInTheDocument();
	});

	it("Dialogコンポーネントがエクスポートされている", () => {
		// コンポーネントが正しくエクスポートされていることを確認
		expect(Dialog).toBeDefined();
		expect(DialogTrigger).toBeDefined();
		expect(DialogHeader).toBeDefined();
		expect(DialogFooter).toBeDefined();
	});
});
