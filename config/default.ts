/**
 * アプリケーション設定の型定義
 */
export interface AppConfig {
  appName: string;
  version: string;
  environment: "development" | "production" | "test";
  port: number;
  gitlab: {
    baseUrl: string;
    apiVersion: string;
    token?: string;
    timeout: number;
    retryAttempts: number;
  };
  analysis: {
    batchSize: number;
    maxConcurrentRequests: number;
    cacheTimeout: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "text";
  };
}

/**
 * デフォルト設定
 */
const defaultConfig: AppConfig = {
  appName: "gitlab_repo_analyzer",
  version: "1.0.0",
  environment: (process.env.NODE_ENV as AppConfig["environment"]) || "development",
  port: Number.parseInt(process.env.PORT || "3000", 10),
  gitlab: {
    baseUrl: process.env.GITLAB_BASE_URL || "https://gitlab.com",
    apiVersion: "v4",
    ...(process.env.GITLAB_TOKEN && { token: process.env.GITLAB_TOKEN }),
    timeout: Number.parseInt(process.env.GITLAB_TIMEOUT || "30000", 10),
    retryAttempts: Number.parseInt(process.env.GITLAB_RETRY_ATTEMPTS || "3", 10),
  },
  analysis: {
    batchSize: Number.parseInt(process.env.ANALYSIS_BATCH_SIZE || "10", 10),
    maxConcurrentRequests: Number.parseInt(process.env.MAX_CONCURRENT_REQUESTS || "5", 10),
    cacheTimeout: Number.parseInt(process.env.CACHE_TIMEOUT || "3600", 10), // 1時間
  },
  logging: {
    level: (process.env.LOG_LEVEL as AppConfig["logging"]["level"]) || "info",
    format: (process.env.LOG_FORMAT as AppConfig["logging"]["format"]) || "text",
  },
};

/**
 * 設定を取得する
 */
export function getConfig(): AppConfig {
  return { ...defaultConfig };
}

/**
 * 設定の検証
 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.appName || config.appName.trim().length === 0) {
    errors.push("アプリケーション名が設定されていません");
  }

  if (!config.version || config.version.trim().length === 0) {
    errors.push("バージョンが設定されていません");
  }

  if (config.port <= 0 || config.port > 65535) {
    errors.push("ポート番号が無効です (1-65535の範囲で設定してください)");
  }

  if (!config.gitlab.baseUrl || config.gitlab.baseUrl.trim().length === 0) {
    errors.push("GitLab Base URLが設定されていません");
  }

  try {
    new URL(config.gitlab.baseUrl);
  } catch {
    errors.push("GitLab Base URLが無効な形式です");
  }

  if (config.gitlab.timeout <= 0) {
    errors.push("GitLabタイムアウト値が無効です");
  }

  if (config.gitlab.retryAttempts < 0) {
    errors.push("GitLabリトライ回数が無効です");
  }

  if (config.analysis.batchSize <= 0) {
    errors.push("分析バッチサイズが無効です");
  }

  if (config.analysis.maxConcurrentRequests <= 0) {
    errors.push("最大同時リクエスト数が無効です");
  }

  if (config.analysis.cacheTimeout < 0) {
    errors.push("キャッシュタイムアウト値が無効です");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
