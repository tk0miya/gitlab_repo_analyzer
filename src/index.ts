/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 * TypeScript基盤設定テスト用
 */

function main(): void {
  console.log('GitLabリポジトリ分析ツール');
  console.log(`TypeScript環境: 正常動作`);
  console.log(`Node.js環境: ${process.version}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
