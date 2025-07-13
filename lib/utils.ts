/**
 * ログレベル定義
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ログメタデータの型定義
 */
export interface LogMetadata {
  [key: string]: any;
}

/**
 * ログ出力インターフェース
 */
export interface Logger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}

/**
 * シンプルなロガー実装
 */
class SimpleLogger implements Logger {
  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  debug(message: string, metadata?: LogMetadata): void {
    console.debug(this.formatMessage("debug", message, metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    console.info(this.formatMessage("info", message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatMessage("warn", message, metadata));
  }

  error(message: string, metadata?: LogMetadata): void {
    console.error(this.formatMessage("error", message, metadata));
  }
}

/**
 * グローバルロガーインスタンス
 */
export const logger: Logger = new SimpleLogger();

/**
 * 文字列が空かどうかをチェック
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * 文字列が有効なURLかどうかをチェック
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * オブジェクトから指定されたキーを除外
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * オブジェクトから指定されたキーのみを抽出
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 遅延実行用ユーティリティ
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 配列を指定されたサイズでチャンクに分割
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error("Chunk size must be greater than 0");

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 一意な値のみを残す配列フィルター
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}
