/**
 * メッセージをフォーマットするユーティリティ関数
 * @param message - フォーマットするメッセージ
 * @param appName - アプリケーション名
 * @returns フォーマットされたメッセージ
 */
export function formatMessage(message: string, appName: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${appName}] ${message}`
}

/**
 * オブジェクトが空かどうかを判定します
 * @param obj - チェックするオブジェクト
 * @returns オブジェクトが空の場合true
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0
}

/**
 * 文字列を安全にトリムします
 * @param str - トリムする文字列（null/undefinedの可能性あり）
 * @returns トリムされた文字列、またはnull/undefinedの場合は空文字
 */
export function safeTrim(str: string | null | undefined): string {
  return str?.trim() ?? ""
}

/**
 * 配列から重複を削除します
 * @param array - 重複を削除する配列
 * @returns 重複が削除された新しい配列
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)]
}

/**
 * 遅延実行のためのユーティリティ関数
 * @param ms - 遅延時間（ミリ秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
