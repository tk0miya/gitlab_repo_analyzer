import { describe, expect, it } from 'vitest';
import { isNotEmpty, isValidUrl } from './utils';

describe('utils', () => {
  describe('isNotEmpty', () => {
    it('空でない文字列でtrueを返す', () => {
      expect(isNotEmpty('hello')).toBe(true);
    });

    it('空文字列でfalseを返す', () => {
      expect(isNotEmpty('')).toBe(false);
    });

    it('空白のみの文字列でfalseを返す', () => {
      expect(isNotEmpty('   ')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('有効なURLでtrueを返す', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('無効なURLでfalseを返す', () => {
      expect(isValidUrl('invalid-url')).toBe(false);
    });
  });
});
