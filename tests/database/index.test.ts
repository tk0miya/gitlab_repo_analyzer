import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Repositories } from "../../src/database/repositories/index.js";
import { cleanupTestDatabase, setupTestDatabase } from "./setup.js";

describe("Database Integration", () => {
	beforeAll(async () => {
		await setupTestDatabase();
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	describe("Repositories", () => {
		it("Repositoriesクラスが正しく初期化されること", async () => {
			const repos = await Repositories.create();

			expect(repos).toBeDefined();
			expect(repos.projects).toBeDefined();
			expect(repos.commits).toBeDefined();
			expect(repos.syncLogs).toBeDefined();
		});

		it("withTransactionで新しいインスタンスを作成できること", async () => {
			const repos = await Repositories.create();
			const db = await setupTestDatabase();

			const txRepos = repos.withTransaction(db);
			expect(txRepos).toBeInstanceOf(Repositories);
			expect(txRepos).not.toBe(repos);
		});
	});
});
