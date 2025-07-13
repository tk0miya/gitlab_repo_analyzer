import { getConfig } from "@config/default";
import { logger } from "@lib/utils";

/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 */
export async function main(): Promise<void> {
  try {
    const config = getConfig();
    logger.info("GitLabリポジトリ分析ツールを開始します", { version: config.version });

    logger.info("プロジェクト初期セットアップが完了しました");
    logger.info("今後のフェーズでGitLab API統合と分析機能を実装します");
  } catch (error) {
    logger.error("アプリケーション起動中にエラーが発生しました", { error });
    process.exit(1);
  }
}

/**
 * アプリケーションのヘルスチェック
 */
export function healthCheck(): { status: string; timestamp: string } {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
}

// CLIから直接実行された場合のエントリーポイント
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
