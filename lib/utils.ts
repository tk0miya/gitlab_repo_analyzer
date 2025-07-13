/**
 * 共通ユーティリティ関数
 */

/**
 * 文字列が空かどうかをチェックする
 * @param str チェックする文字列
 * @returns 空の場合true、そうでなければfalse
 */
export function isEmpty(str: string): boolean {
    return str.trim().length === 0;
}

/**
 * 配列の重複を除去する
 * @param array 重複を除去する配列
 * @returns 重複の除去された新しい配列
 */
export function removeDuplicates<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * オブジェクトが空かどうかをチェックする
 * @param obj チェックするオブジェクト
 * @returns 空の場合true、そうでなければfalse
 */
export function isEmptyObject(obj: object): boolean {
    return Object.keys(obj).length === 0;
}

/**
 * 遅延処理のためのsleep関数
 * @param ms 遅延時間（ミリ秒）
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ランダムな文字列を生成する
 * @param length 文字列の長さ
 * @returns ランダムな文字列
 */
export function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
