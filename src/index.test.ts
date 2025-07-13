import { beforeEach, describe, expect, it, vi } from "vitest";
import { healthCheck, main } from "./index";

// モック設定
vi.mock("@config/default", () => ({
  getConfig: vi.fn(() => ({
    version: "1.0.0",
    appName: "gitlab_repo_analyzer",
  })),
}));

vi.mock("@lib/utils", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("index.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("healthCheck", () => {
    it("正常なヘルスチェックレスポンスを返す", () => {
      const result = healthCheck();

      expect(result).toHaveProperty("status", "healthy");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it("タイムスタンプがISO8601形式である", () => {
      const result = healthCheck();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.toISOString()).toBe(result.timestamp);
    });
  });

  describe("main", () => {
    it("正常に起動する", async () => {
      await expect(main()).resolves.toBeUndefined();
    });
  });
});
