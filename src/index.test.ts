/**
 * メイン関数のテスト
 */
import { describe, expect, it } from 'vitest';
import { main } from './index.js';

describe('main関数', () => {
    it('正しいメッセージを返すこと', () => {
        const result = main();
        expect(result).toBe('GitLab リポジトリ分析ツールを開始します');
    });

    it('文字列を返すこと', () => {
        const result = main();
        expect(typeof result).toBe('string');
    });
});
