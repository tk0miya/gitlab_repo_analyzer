/**
 * Next.js instrumentation - サーバ起動時初期化処理
 * GitLabトークン設定の検証を行い、未設定の場合はサーバ起動を停止する
 */

export async function register() {
	try {
		const { loadConfig } = await import("./src/config/index");
		await loadConfig();
		console.log("✓ サーバ起動時設定検証完了");
	} catch (error) {
		console.error(
			"❌ 設定エラー:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}
