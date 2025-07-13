import { beforeEach, describe, expect, it, vi } from "vitest"
import { delay, formatMessage, isEmpty, removeDuplicates, safeTrim } from "./utils"

describe("lib/utils", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe("formatMessage", () => {
    it("メッセージを正しくフォーマットする", () => {
      // 固定の日時でテスト
      const fixedDate = new Date("2024-01-01T00:00:00.000Z")
      vi.setSystemTime(fixedDate)

      const result = formatMessage("テストメッセージ", "test-app")
      expect(result).toBe("[2024-01-01T00:00:00.000Z] [test-app] テストメッセージ")
    })

    it("空のメッセージでも正しくフォーマットする", () => {
      const fixedDate = new Date("2024-01-01T00:00:00.000Z")
      vi.setSystemTime(fixedDate)

      const result = formatMessage("", "test-app")
      expect(result).toBe("[2024-01-01T00:00:00.000Z] [test-app] ")
    })
  })

  describe("isEmpty", () => {
    it("空のオブジェクトに対してtrueを返す", () => {
      expect(isEmpty({})).toBe(true)
    })

    it("プロパティがあるオブジェクトに対してfalseを返す", () => {
      expect(isEmpty({ key: "value" })).toBe(false)
      expect(isEmpty({ a: 1, b: 2 })).toBe(false)
    })

    it("null値のプロパティがあるオブジェクトに対してfalseを返す", () => {
      expect(isEmpty({ key: null })).toBe(false)
    })
  })

  describe("safeTrim", () => {
    it("正常な文字列を正しくトリムする", () => {
      expect(safeTrim("  hello  ")).toBe("hello")
      expect(safeTrim("test")).toBe("test")
    })

    it("nullに対して空文字を返す", () => {
      expect(safeTrim(null)).toBe("")
    })

    it("undefinedに対して空文字を返す", () => {
      expect(safeTrim(undefined)).toBe("")
    })

    it("空文字に対して空文字を返す", () => {
      expect(safeTrim("")).toBe("")
      expect(safeTrim("   ")).toBe("")
    })
  })

  describe("removeDuplicates", () => {
    it("重複する要素を削除する", () => {
      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(removeDuplicates(["a", "b", "a", "c"])).toEqual(["a", "b", "c"])
    })

    it("重複がない場合は元の配列と同じ要素を返す", () => {
      expect(removeDuplicates([1, 2, 3])).toEqual([1, 2, 3])
      expect(removeDuplicates(["a", "b", "c"])).toEqual(["a", "b", "c"])
    })

    it("空の配列に対して空の配列を返す", () => {
      expect(removeDuplicates([])).toEqual([])
    })

    it("オブジェクトの配列でも動作する", () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      expect(removeDuplicates([obj1, obj2, obj1])).toEqual([obj1, obj2])
    })
  })

  describe("delay", () => {
    it("指定した時間だけ遅延する", async () => {
      const promise = delay(1000)

      // 遅延が開始される前はまだ解決されていない
      expect(vi.getTimerCount()).toBe(1)

      // 時間を進める
      vi.advanceTimersByTime(1000)

      // Promiseが解決される
      await expect(promise).resolves.toBeUndefined()
    })

    it("0ミリ秒の遅延でも正常に動作する", async () => {
      const promise = delay(0)
      vi.advanceTimersByTime(0)
      await expect(promise).resolves.toBeUndefined()
    })
  })
})
