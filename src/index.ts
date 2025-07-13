/**
 * GitLab Repository Analyzer
 * GitLabリポジトリを分析するメインエントリーポイント
 */

console.log('GitLab Repository Analyzer が起動しました');

export default function main(): void {
  console.log('TypeScript設定が正常に動作しています');
}

// エントリーポイントとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}