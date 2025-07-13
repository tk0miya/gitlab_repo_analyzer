/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 */

export function main(): void {
  console.log('GitLabリポジトリ分析ツールを開始します');
}

// CLIから直接実行された場合
if (require.main === module) {
  main();
}
