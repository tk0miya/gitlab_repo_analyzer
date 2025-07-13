import { getAppConfig } from "@config/default"
import { formatMessage } from "@lib/utils"

/**
 * メインエントリーポイント関数
 * GitLabリポジトリアナライザーのアプリケーションを開始します
 */
export async function main(): Promise<void> {
  const config = getAppConfig()
  const welcomeMessage = formatMessage("GitLabリポジトリアナライザーを開始します", config.appName)

  console.log(welcomeMessage)
  console.log(`環境: ${config.environment}`)
  console.log(`バージョン: ${config.version}`)
}

/**
 * アプリケーションを初期化し、実行します
 */
export async function initializeApp(): Promise<void> {
  try {
    await main()
  } catch (error) {
    console.error("アプリケーションの初期化中にエラーが発生しました:", error)
    process.exit(1)
  }
}

// スクリプトとして直接実行された場合のみメイン関数を呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp()
}
