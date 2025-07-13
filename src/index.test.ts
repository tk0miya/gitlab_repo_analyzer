import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// モジュールをモック化
vi.mock("@config/default", () => ({
  getAppConfig: vi.fn(() => ({
    appName: "test-app",
    environment: "test",
    version: "1.0.0-test",
  })),
}))

vi.mock("@lib/utils", () => ({
  formatMessage: vi.fn((message: string, appName: string) => `[${appName}] ${message}`),
}))

import { initializeApp, main } from "./index"

describe("src/index", () => {
  // コンソール出力をモック化
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
    // コンソール出力を無効化
  })
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
    // エラー出力を無効化
  })

  beforeEach(() => {
    consoleSpy.mockClear()
    consoleErrorSpy.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("main", () => {
    it("設定を読み込み、ウェルカムメッセージを表示する", async () => {
      await main()

      expect(consoleSpy).toHaveBeenCalledWith("[test-app] GitLabリポジトリアナライザーを開始します")
      expect(consoleSpy).toHaveBeenCalledWith("環境: test")
      expect(consoleSpy).toHaveBeenCalledWith("バージョン: 1.0.0-test")
      expect(consoleSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe("initializeApp", () => {
    it("正常に初期化を完了する", async () => {
      await expect(initializeApp()).resolves.not.toThrow()
      expect(consoleSpy).toHaveBeenCalledTimes(3)
    })

    // 注意: エラーハンドリングのテストは複雑なモック設定が必要なため、
    // 現在は統合テストやE2Eテストでカバーすることを推奨
  })
})
