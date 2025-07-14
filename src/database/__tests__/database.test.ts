import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DatabaseConnection, getDb } from "../connection.js";
import type { Project, ProjectMember, User } from "../types.js";

describe("Database", () => {
	let dbConnection: DatabaseConnection;

	beforeAll(async () => {
		// テスト環境での接続
		process.env.NODE_ENV = "test";
		process.env.DB_NAME = "gitlab_analyzer_test";

		dbConnection = DatabaseConnection.getInstance();
		await dbConnection.initialize();
	});

	afterAll(async () => {
		await dbConnection.close();
	});

	describe("Connection", () => {
		it("should connect to database", async () => {
			const healthCheck = await dbConnection.healthCheck();
			expect(healthCheck.status).toBe("ok");
			expect(healthCheck.message).toBe("データベース接続正常");
		});

		it("should get knex instance", () => {
			const knex = getDb();
			expect(knex).toBeDefined();
		});
	});

	describe("Migration", () => {
		it("should run migrations without error", async () => {
			// マイグレーション実行をテスト
			await expect(dbConnection.runMigrations()).resolves.not.toThrow();
		});

		it("should have all tables created", async () => {
			const knex = getDb();

			// テーブルの存在確認
			const tables = [
				"users",
				"projects",
				"project_members",
				"merge_requests",
				"commits",
				"commit_merge_requests",
				"comments",
			];

			for (const table of tables) {
				const exists = await knex.schema.hasTable(table);
				expect(exists).toBe(true);
			}
		});
	});

	describe("Basic CRUD Operations", () => {
		it("should insert and retrieve user", async () => {
			const knex = getDb();

			const userData: Omit<User, "id"> = {
				username: "testuser",
				name: "Test User",
				email: "test@example.com",
				created_at: new Date(),
				updated_at: new Date(),
				is_admin: false,
				can_create_group: false,
				can_create_project: true,
			};

			// ユーザー作成
			const [insertedUser] = await knex("users")
				.insert(userData)
				.returning("*");
			expect(insertedUser).toBeDefined();
			expect(insertedUser.username).toBe(userData.username);

			// ユーザー取得
			const foundUser = await knex("users")
				.where({ id: insertedUser.id })
				.first();
			expect(foundUser).toBeDefined();
			expect(foundUser.username).toBe(userData.username);

			// クリーンアップ
			await knex("users").where({ id: insertedUser.id }).del();
		});

		it("should insert and retrieve project", async () => {
			const knex = getDb();

			const projectData: Omit<Project, "id"> = {
				name: "Test Project",
				path: "test-project",
				namespace_path: "test-namespace",
				web_url: "https://gitlab.example.com/test-namespace/test-project",
				archived: false,
				issues_enabled: true,
				merge_requests_enabled: true,
				wiki_enabled: false,
				snippets_enabled: false,
				created_at: new Date(),
				updated_at: new Date(),
				star_count: 0,
				forks_count: 0,
			};

			// プロジェクト作成
			const [insertedProject] = await knex("projects")
				.insert(projectData)
				.returning("*");
			expect(insertedProject).toBeDefined();
			expect(insertedProject.name).toBe(projectData.name);

			// プロジェクト取得
			const foundProject = await knex("projects")
				.where({ id: insertedProject.id })
				.first();
			expect(foundProject).toBeDefined();
			expect(foundProject.name).toBe(projectData.name);

			// クリーンアップ
			await knex("projects").where({ id: insertedProject.id }).del();
		});

		it("should handle foreign key relationships", async () => {
			const knex = getDb();

			// テストユーザー作成
			const userData: Omit<User, "id"> = {
				username: "membertest",
				name: "Member Test",
				created_at: new Date(),
				updated_at: new Date(),
				is_admin: false,
				can_create_group: false,
				can_create_project: true,
			};
			const [user] = await knex("users").insert(userData).returning("*");

			// テストプロジェクト作成
			const projectData: Omit<Project, "id"> = {
				name: "Member Test Project",
				path: "member-test-project",
				namespace_path: "test-namespace",
				web_url:
					"https://gitlab.example.com/test-namespace/member-test-project",
				archived: false,
				issues_enabled: true,
				merge_requests_enabled: true,
				wiki_enabled: false,
				snippets_enabled: false,
				created_at: new Date(),
				updated_at: new Date(),
				star_count: 0,
				forks_count: 0,
			};
			const [project] = await knex("projects")
				.insert(projectData)
				.returning("*");

			// プロジェクトメンバー作成
			const memberData: Omit<ProjectMember, "id"> = {
				project_id: project.id,
				user_id: user.id,
				access_level: 30, // Developer
				created_at: new Date(),
				updated_at: new Date(),
			};
			const [member] = await knex("project_members")
				.insert(memberData)
				.returning("*");

			expect(member).toBeDefined();
			expect(member.project_id).toBe(project.id);
			expect(member.user_id).toBe(user.id);

			// JOINクエリテスト
			const memberWithDetails = await knex("project_members")
				.where({ "project_members.id": member.id })
				.join("users", "project_members.user_id", "users.id")
				.join("projects", "project_members.project_id", "projects.id")
				.select(
					"project_members.*",
					"users.username",
					"users.name as user_name",
					"projects.name as project_name",
				)
				.first();

			expect(memberWithDetails).toBeDefined();
			expect(memberWithDetails.username).toBe(userData.username);
			expect(memberWithDetails.project_name).toBe(projectData.name);

			// クリーンアップ（外部キー制約により自動的にメンバーも削除される）
			await knex("projects").where({ id: project.id }).del();
			await knex("users").where({ id: user.id }).del();
		});
	});

	describe("Indexes", () => {
		it("should have proper indexes created", async () => {
			const knex = getDb();

			// PostgreSQLのインデックス確認クエリ
			const indexes = await knex.raw(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);

			expect(indexes.rows.length).toBeGreaterThan(0);

			// 重要なインデックスの存在確認
			const indexNames = indexes.rows.map(
				(row: { indexname: string }) => row.indexname,
			);
			expect(indexNames).toContain("idx_users_username");
			expect(indexNames).toContain("idx_projects_namespace");
			expect(indexNames).toContain("idx_merge_requests_project_state");
			expect(indexNames).toContain("idx_commits_project_date");
		});
	});
});
