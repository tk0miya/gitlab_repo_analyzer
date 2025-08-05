/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 */

import { SyncCommitsService } from "@/services/sync-commits";

async function main(): Promise<void> {
	try {
		const syncService = new SyncCommitsService();
		await syncService.syncCommits();
	} catch (error) {
		console.error("\n❌ コミット同期コマンドでエラーが発生しました:");
		console.error(String(error));
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("予期しないエラー:", error);
		process.exit(1);
	});
}
