/**
 * アプリケーション設定の型定義
 */
export interface AppConfig {
  /** アプリケーション名 */
  appName: string
  /** 実行環境 */
  environment: string
  /** アプリケーションバージョン */
  version: string
  /** GitLab API設定 */
  gitlab: {
    /** GitLab APIのベースURL */
    baseUrl: string
    /** APIトークン（環境変数から取得） */
    token: string | null
    /** APIリクエストのタイムアウト（ミリ秒） */
    timeout: number
  }
  /** ログ設定 */
  logging: {
    /** ログレベル */
    level: "debug" | "info" | "warn" | "error"
    /** ログファイルの出力先 */
    outputPath?: string
  }
}

/**
 * デフォルト設定を取得します
 * 環境変数から設定を読み込み、デフォルト値とマージします
 */
export function getAppConfig(): AppConfig {
  const environment = process.env.NODE_ENV || "development"

  return {
    appName: "gitlab-repo-analyzer",
    environment,
    version: process.env.npm_package_version || "1.0.0",
    gitlab: {
      baseUrl: process.env.GITLAB_BASE_URL || "https://gitlab.com/api/v4",
      token: process.env.GITLAB_TOKEN || null,
      timeout: Number.parseInt(process.env.GITLAB_TIMEOUT || "10000", 10),
    },
    logging: {
      level: (process.env.LOG_LEVEL as AppConfig["logging"]["level"]) || "info",
      outputPath: process.env.LOG_OUTPUT_PATH,
    },
  }
}

/**
 * 設定値を検証します
 * @param config - 検証するアプリケーション設定
 * @throws 設定に問題がある場合はエラーを投げます
 */
export function validateConfig(config: AppConfig): void {
  if (!config.appName) {
    throw new Error("アプリケーション名が設定されていません")
  }

  if (!config.version) {
    throw new Error("アプリケーションバージョンが設定されていません")
  }

  if (config.gitlab.timeout < 0) {
    throw new Error("GitLab APIタイムアウト値は0以上である必要があります")
  }

  const validLogLevels = ["debug", "info", "warn", "error"]
  if (!validLogLevels.includes(config.logging.level)) {
    throw new Error(`無効なログレベルです: ${config.logging.level}`)
  }
}

/**
 * 検証済みの設定を取得します
 */
export function getValidatedAppConfig(): AppConfig {
  const config = getAppConfig()
  validateConfig(config)
  return config
}
