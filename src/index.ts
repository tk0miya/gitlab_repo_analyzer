/**
 * GitLabリポジトリ分析ツールのメインエントリーポイント
 */

/**
 * アプリケーションのメイン関数
 */
export function main(): string {
    return 'GitLab リポジトリ分析ツールを開始します';
}

// スクリプトとして直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log(main());
}
