/**
 * GitLab Repository Analyzer
 * メインエントリーポイント
 */

// パスエイリアスのテスト用インポート（将来の実装で使用）
// import { SomeUtil } from '@/lib/util';

/**
 * アプリケーションのメイン関数
 */
function main(): void {
  console.log('GitLab Repository Analyzer - TypeScript基盤設定完了');
  
  // 型安全性のテスト
  const version: string = '1.0.0';
  const isEnabled: boolean = true;
  
  console.log(`Version: ${version}, Enabled: ${isEnabled}`);
}

// 直接実行された場合のみmain関数を呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };