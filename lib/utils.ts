/**
 * 共通ユーティリティ関数
 */

/**
 * 文字列が空でないかチェックする
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * URLが有効かチェックする
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
