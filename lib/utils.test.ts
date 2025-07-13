/**
 * ユーティリティ関数のテスト
 */
import { describe, expect, it } from 'vitest';
import { generateRandomString, isEmpty, isEmptyObject, removeDuplicates, sleep } from './utils.js';

describe('isEmpty', () => {
    it('空文字列の場合はtrueを返すこと', () => {
        expect(isEmpty('')).toBe(true);
    });

    it('空白のみの文字列の場合はtrueを返すこと', () => {
        expect(isEmpty('   ')).toBe(true);
    });

    it('文字が含まれる場合はfalseを返すこと', () => {
        expect(isEmpty('hello')).toBe(false);
    });

    it('空白に囲まれた文字が含まれる場合はfalseを返すこと', () => {
        expect(isEmpty('  hello  ')).toBe(false);
    });
});

describe('removeDuplicates', () => {
    it('重複のない配列はそのまま返すこと', () => {
        const input = [1, 2, 3, 4];
        const result = removeDuplicates(input);
        expect(result).toEqual([1, 2, 3, 4]);
    });

    it('重複のある配列から重複を除去すること', () => {
        const input = [1, 2, 2, 3, 3, 3, 4];
        const result = removeDuplicates(input);
        expect(result).toEqual([1, 2, 3, 4]);
    });

    it('文字列配列でも動作すること', () => {
        const input = ['a', 'b', 'a', 'c', 'b'];
        const result = removeDuplicates(input);
        expect(result).toEqual(['a', 'b', 'c']);
    });

    it('空配列の場合は空配列を返すこと', () => {
        const input: number[] = [];
        const result = removeDuplicates(input);
        expect(result).toEqual([]);
    });
});

describe('isEmptyObject', () => {
    it('空のオブジェクトの場合はtrueを返すこと', () => {
        expect(isEmptyObject({})).toBe(true);
    });

    it('プロパティがあるオブジェクトの場合はfalseを返すこと', () => {
        expect(isEmptyObject({ a: 1 })).toBe(false);
    });
});

describe('sleep', () => {
    it('指定した時間後にresolveすること', async () => {
        const start = Date.now();
        await sleep(100);
        const end = Date.now();
        const elapsed = end - start;
        // 100ms ± 50msの範囲内であることを確認（テスト環境の誤差を考慮）
        expect(elapsed).toBeGreaterThanOrEqual(50);
        expect(elapsed).toBeLessThan(200);
    });
});

describe('generateRandomString', () => {
    it('指定した長さの文字列を返すこと', () => {
        const result = generateRandomString(10);
        expect(result.length).toBe(10);
    });

    it('英数字のみで構成されること', () => {
        const result = generateRandomString(100);
        const validChars = /^[A-Za-z0-9]+$/;
        expect(validChars.test(result)).toBe(true);
    });

    it('毎回異なる文字列を生成すること', () => {
        const result1 = generateRandomString(20);
        const result2 = generateRandomString(20);
        expect(result1).not.toBe(result2);
    });

    it('長さが0の場合は空文字列を返すこと', () => {
        const result = generateRandomString(0);
        expect(result).toBe('');
    });
});
