import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chunk, delay, isEmpty, isValidUrl, logger, omit, pick, unique } from "./utils";

describe("utils.ts", () => {
  describe("logger", () => {
    beforeEach(() => {
      vi.spyOn(console, "debug").mockImplementation(() => {});
      vi.spyOn(console, "info").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("debug メッセージを出力する", () => {
      logger.debug("テストメッセージ");
      expect(console.debug).toHaveBeenCalled();
    });

    it("info メッセージを出力する", () => {
      logger.info("テストメッセージ");
      expect(console.info).toHaveBeenCalled();
    });

    it("warn メッセージを出力する", () => {
      logger.warn("テストメッセージ");
      expect(console.warn).toHaveBeenCalled();
    });

    it("error メッセージを出力する", () => {
      logger.error("テストメッセージ");
      expect(console.error).toHaveBeenCalled();
    });

    it("メタデータ付きでメッセージを出力する", () => {
      const metadata = { key: "value", number: 42 };
      logger.info("テストメッセージ", metadata);
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(metadata)));
    });
  });

  describe("isEmpty", () => {
    it("空文字列をtrueとして返す", () => {
      expect(isEmpty("")).toBe(true);
    });

    it("空白のみの文字列をtrueとして返す", () => {
      expect(isEmpty("   ")).toBe(true);
    });

    it("nullをtrueとして返す", () => {
      expect(isEmpty(null)).toBe(true);
    });

    it("undefinedをtrueとして返す", () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it("有効な文字列をfalseとして返す", () => {
      expect(isEmpty("テスト")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("有効なHTTP URLをtrueとして返す", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
    });

    it("有効なHTTPS URLをtrueとして返す", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
    });

    it("無効なURLをfalseとして返す", () => {
      expect(isValidUrl("invalid-url")).toBe(false);
    });

    it("空文字列をfalseとして返す", () => {
      expect(isValidUrl("")).toBe(false);
    });
  });

  describe("omit", () => {
    it("指定されたキーを除外したオブジェクトを返す", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ["b"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("複数のキーを除外する", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, ["b", "d"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("元のオブジェクトを変更しない", () => {
      const obj = { a: 1, b: 2, c: 3 };
      omit(obj, ["b"]);
      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe("pick", () => {
    it("指定されたキーのみを含むオブジェクトを返す", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ["a", "c"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("存在しないキーは無視する", () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, ["a", "nonexistent" as keyof typeof obj]);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe("delay", () => {
    it("指定された時間だけ遅延する", async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe("chunk", () => {
    it("配列を指定されたサイズでチャンクに分割する", () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const result = chunk(array, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it("配列の長さがチャンクサイズより小さい場合", () => {
      const array = [1, 2];
      const result = chunk(array, 5);
      expect(result).toEqual([[1, 2]]);
    });

    it("空配列を渡した場合", () => {
      const array: number[] = [];
      const result = chunk(array, 3);
      expect(result).toEqual([]);
    });

    it("チャンクサイズが0以下の場合はエラーを投げる", () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow();
      expect(() => chunk([1, 2, 3], -1)).toThrow();
    });
  });

  describe("unique", () => {
    it("重複を除去した配列を返す", () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const result = unique(array);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("文字列配列の重複を除去する", () => {
      const array = ["a", "b", "a", "c", "b"];
      const result = unique(array);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("空配列を渡した場合は空配列を返す", () => {
      const result = unique([]);
      expect(result).toEqual([]);
    });

    it("重複がない場合は同じ配列を返す", () => {
      const array = [1, 2, 3, 4];
      const result = unique(array);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });
});
